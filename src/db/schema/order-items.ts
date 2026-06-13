import { relations } from "drizzle-orm"
import {
  decimal,
  index,
  integer,
  pgTable,
  varchar,
} from "drizzle-orm/pg-core"

import { generateId } from "@/lib/id"

import { orders } from "./orders"
import { products } from "./products"
import { lifecycleDates } from "./utils"

export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 30 })
      .$defaultFn(() => generateId())
      .primaryKey(),
    orderId: varchar("order_id", { length: 30 })
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: varchar("product_id", { length: 30 })
      .references(() => products.id, { onDelete: "restrict" })
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    ...lifecycleDates,
  },
  (table) => ({
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
    productIdIdx: index("order_items_product_id_idx").on(table.productId),
  })
)

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
