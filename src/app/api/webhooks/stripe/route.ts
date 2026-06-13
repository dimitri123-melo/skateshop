import { revalidateTag } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/db"
import {
  addresses,
  carts,
  orderItems,
  orders,
  payments,
  products,
  transactions,
} from "@/db/schema"
import { env } from "@/env.js"
import { clerkClient } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"
import { z } from "zod"

import { logger } from "@/lib/logger"
import { stripe } from "@/lib/stripe"
import { checkoutItemSchema } from "@/lib/validations/cart"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("Stripe-Signature") ?? ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    logger.error("Webhook signature verification failed", { error: err })
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error."}`,
      { status: 400 }
    )
  }

  logger.info(`Processing Stripe webhook: ${event.type}`, {
    action: "stripe_webhook",
  })

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object

      if (session?.metadata?.userId && !session?.metadata?.cartId) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        const client = await clerkClient()
        await client.users.updateUserMetadata(session.metadata.userId, {
          privateMetadata: {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        })

        logger.info("Subscription created", {
          action: "subscription_created",
          userId: session.metadata.userId,
        })
      }
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object

      if (invoice?.metadata?.userId && !invoice?.metadata?.cartId) {
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )

        const client = await clerkClient()
        await client.users.updateUserMetadata(invoice.metadata.userId, {
          privateMetadata: {
            stripePriceId: subscription.items.data[0]?.price.id,
            stripeCurrentPeriodEnd: new Date(
              subscription.current_period_end * 1000
            ),
          },
        })
      }
      revalidateTag(`${invoice?.metadata?.userId}-subscription`)
      break
    }

    case "payment_intent.payment_failed": {
      const failedPayment = event.data.object
      logger.warn("Payment failed", {
        action: "payment_failed",
        error: failedPayment.last_payment_error?.message,
      })

      if (event.account) {
        const payment = await db.query.payments.findFirst({
          columns: { storeId: true },
          where: eq(payments.stripeAccountId, event.account),
        })

        if (payment?.storeId) {
          await db.insert(transactions).values({
            storeId: payment.storeId,
            type: "payment",
            status: "failed",
            amount: String(Number(failedPayment.amount) / 100),
            stripePaymentIntentId: failedPayment.id,
            description: failedPayment.last_payment_error?.message ?? "Payment failed",
          })
        }
      }
      break
    }

    case "payment_intent.processing": {
      const processingPayment = event.data.object
      logger.info("Payment processing", {
        action: "payment_processing",
      })
      break
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object

      if (paymentIntent?.metadata?.items) {
        try {
          if (!event.account) throw new Error("No account found.")

          const safeParsedItems = z
            .array(checkoutItemSchema)
            .safeParse(JSON.parse(paymentIntent.metadata.items ?? "[]"))

          if (!safeParsedItems.success) {
            throw new Error("Could not parse items.")
          }

          const payment = await db.query.payments.findFirst({
            columns: { storeId: true },
            where: eq(payments.stripeAccountId, event.account),
          })

          if (!payment?.storeId) {
            return new Response("Store not found.", { status: 404 })
          }

          const stripeAddress = paymentIntent.shipping?.address

          const newAddress = await db
            .insert(addresses)
            .values({
              line1: stripeAddress?.line1,
              line2: stripeAddress?.line2,
              city: stripeAddress?.city,
              state: stripeAddress?.state,
              country: stripeAddress?.country,
              postalCode: stripeAddress?.postal_code,
            })
            .returning({ insertedId: addresses.id })

          if (!newAddress[0]?.insertedId) throw new Error("No address created.")

          // Create order
          const newOrder = await db
            .insert(orders)
            .values({
              storeId: payment.storeId,
              items: safeParsedItems.data,
              quantity: safeParsedItems.data.reduce(
                (acc, item) => acc + item.quantity,
                0
              ),
              amount: String(Number(paymentIntent.amount) / 100),
              status: "pending",
              stripePaymentIntentId: paymentIntent.id,
              stripePaymentIntentStatus: paymentIntent.status,
              name: paymentIntent.shipping?.name ?? "",
              email: paymentIntent.receipt_email ?? "",
              addressId: newAddress[0].insertedId,
            })
            .returning({ insertedId: orders.id })

          const orderId = newOrder[0]?.insertedId

          // Create order items for relational integrity
          if (orderId) {
            for (const item of safeParsedItems.data) {
              await db.insert(orderItems).values({
                orderId,
                productId: item.productId,
                quantity: item.quantity,
                price: String(item.price),
              })
            }
          }

          // Create transaction record
          await db.insert(transactions).values({
            storeId: payment.storeId,
            orderId: orderId ?? undefined,
            type: "payment",
            status: "completed",
            amount: String(Number(paymentIntent.amount) / 100),
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge as string | undefined,
          })

          // Update product inventory
          for (const item of safeParsedItems.data) {
            const product = await db.query.products.findFirst({
              columns: { id: true, inventory: true },
              where: eq(products.id, item.productId),
            })

            if (!product) {
              logger.warn("Product not found during inventory update", {
                action: "inventory_update",
              })
              continue
            }

            const newInventory = Math.max(0, product.inventory - item.quantity)

            await db
              .update(products)
              .set({ inventory: newInventory })
              .where(eq(products.id, item.productId))
          }

          // Close cart
          await db
            .update(carts)
            .set({ closed: true, items: [] })
            .where(eq(carts.paymentIntentId, paymentIntent.id))

          logger.info("Order created successfully", {
            action: "order_created",
            orderId,
            storeId: payment.storeId,
          })
        } catch (err) {
          logger.error("Error creating order from payment", {
            action: "order_creation_error",
            error: err,
          })
        }
      }
      break
    }

    case "charge.refunded": {
      const refund = event.data.object
      logger.info("Charge refunded", {
        action: "charge_refunded",
      })

      if (event.account) {
        const payment = await db.query.payments.findFirst({
          columns: { storeId: true },
          where: eq(payments.stripeAccountId, event.account),
        })

        if (payment?.storeId) {
          await db.insert(transactions).values({
            storeId: payment.storeId,
            type: "refund",
            status: "completed",
            amount: String(Number(refund.amount_refunded) / 100),
            stripeChargeId: refund.id,
            description: "Refund processed",
          })
        }
      }
      break
    }

    case "application_fee.created": {
      const fee = event.data.object
      logger.info("Application fee created", { action: "application_fee" })
      break
    }

    case "charge.succeeded": {
      const charge = event.data.object
      logger.info("Charge succeeded", { action: "charge_succeeded" })
      break
    }

    default:
      logger.warn(`Unhandled event type: ${event.type}`, {
        action: "unhandled_webhook",
      })
  }

  return new Response(null, { status: 200 })
}
