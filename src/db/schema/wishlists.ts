import { relations } from "drizzle-orm"
import { index, pgTable, unique, varchar } from "drizzle-orm/pg-core"

import { generateId } from "@/lib/id"

import { products } from "./products"
import { lifecycleDates } from "./utils"

export const wishlists = pgTable(
  "wishlists",
  {
    id: varchar("id", { length: 30 })
      .$defaultFn(() => generateId())
      .primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    productId: varchar("product_id", { length: 30 })
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    ...lifecycleDates,
  },
  (table) => ({
    userIdIdx: index("wishlists_user_id_idx").on(table.userId),
    productIdIdx: index("wishlists_product_id_idx").on(table.productId),
    userProductUnique: unique("wishlists_user_product_unique").on(
      table.userId,
      table.productId
    ),
  })
)

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}))

export type Wishlist = typeof wishlists.$inferSelect
export type NewWishlist = typeof wishlists.$inferInsert
