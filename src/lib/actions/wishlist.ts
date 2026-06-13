"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import {
  categories,
  products,
  stores,
  subcategories,
  wishlists,
} from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq, inArray } from "drizzle-orm"

import { getErrorMessage } from "@/lib/handle-error"
import { logger } from "@/lib/logger"

export async function getWishlist() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return { data: [], error: null }
    }

    const wishlistItems = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        productName: products.name,
        productPrice: products.price,
        productImages: products.images,
        productInventory: products.inventory,
        storeName: stores.name,
        storeId: products.storeId,
        category: categories.name,
        subcategory: subcategories.name,
        addedAt: wishlists.createdAt,
      })
      .from(wishlists)
      .leftJoin(products, eq(products.id, wishlists.productId))
      .leftJoin(stores, eq(stores.id, products.storeId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(subcategories, eq(subcategories.id, products.subcategoryId))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt))

    return { data: wishlistItems, error: null }
  } catch (err) {
    logger.error("Failed to fetch wishlist", { action: "getWishlist", error: err })
    return { data: [], error: getErrorMessage(err) }
  }
}

export async function addToWishlist(productId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("You must be signed in to add items to your wishlist")
    }

    const existing = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ),
    })

    if (existing) {
      throw new Error("This product is already in your wishlist")
    }

    await db.insert(wishlists).values({
      userId,
      productId,
    })

    revalidatePath("/")

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}

export async function removeFromWishlist(productId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    await db
      .delete(wishlists)
      .where(
        and(eq(wishlists.userId, userId), eq(wishlists.productId, productId))
      )

    revalidatePath("/")

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}

export async function isInWishlist(productId: string) {
  try {
    const { userId } = await auth()

    if (!userId) return false

    const item = await db.query.wishlists.findFirst({
      where: and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ),
    })

    return !!item
  } catch {
    return false
  }
}

export async function clearWishlist() {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    await db.delete(wishlists).where(eq(wishlists.userId, userId))

    revalidatePath("/")

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}
