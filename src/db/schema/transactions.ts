import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core"

import { generateId } from "@/lib/id"

import { orders } from "./orders"
import { stores } from "./stores"
import { lifecycleDates } from "./utils"

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
])

export const transactionTypeEnum = pgEnum("transaction_type", [
  "payment",
  "refund",
  "payout",
  "subscription",
])

export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id", { length: 30 })
      .$defaultFn(() => generateId())
      .primaryKey(),
    storeId: varchar("store_id", { length: 30 })
      .references(() => stores.id, { onDelete: "cascade" })
      .notNull(),
    orderId: varchar("order_id", { length: 30 }).references(() => orders.id, {
      onDelete: "set null",
    }),
    type: transactionTypeEnum("type").notNull(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    stripeRefundId: text("stripe_refund_id"),
    description: text("description"),
    ...lifecycleDates,
  },
  (table) => ({
    storeIdIdx: index("transactions_store_id_idx").on(table.storeId),
    orderIdIdx: index("transactions_order_id_idx").on(table.orderId),
    typeIdx: index("transactions_type_idx").on(table.type),
    statusIdx: index("transactions_status_idx").on(table.status),
  })
)

export const transactionsRelations = relations(transactions, ({ one }) => ({
  store: one(stores, {
    fields: [transactions.storeId],
    references: [stores.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}))

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
