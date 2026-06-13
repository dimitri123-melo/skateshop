import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core"

import { generateId } from "@/lib/id"
import { type CheckoutItemSchema } from "@/lib/validations/cart"

import { addresses } from "./addresses"
import { orderItems } from "./order-items"
import { stores } from "./stores"
import { transactions } from "./transactions"
import { lifecycleDates } from "./utils"

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
])

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 30 })
      .$defaultFn(() => generateId())
      .primaryKey(),
    storeId: varchar("store_id", { length: 30 })
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar("user_id", { length: 36 }),
    items: json("items").$type<CheckoutItemSchema[] | null>().default(null),
    quantity: integer("quantity"),
    amount: decimal("amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    status: orderStatusEnum("status").notNull().default("pending"),
    stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
    stripePaymentIntentStatus: text("stripe_payment_intent_status").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    addressId: varchar("address_id", { length: 30 })
      .references(() => addresses.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (table) => ({
    storeIdIdx: index("orders_store_id_idx").on(table.storeId),
    addressIdIdx: index("orders_address_id_idx").on(table.addressId),
    userIdIdx: index("orders_user_id_idx").on(table.userId),
    statusIdx: index("orders_status_idx").on(table.status),
  })
)

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  address: one(addresses, {
    fields: [orders.addressId],
    references: [addresses.id],
  }),
  orderItems: many(orderItems),
  transactions: many(transactions),
}))

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
