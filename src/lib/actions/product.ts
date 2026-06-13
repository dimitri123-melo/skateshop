"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { db } from "@/db"
import { products } from "@/db/schema"
import type { StoredFile } from "@/types"
import { and, eq } from "drizzle-orm"
import { type z } from "zod"

import { type createProductSchema, type updateProductRatingSchema } from "@/lib/validations/product"
import { type CreateProductSchema } from "@/lib/validations/product"
import { createAction } from "@/lib/actions/utils"

export const filterProducts = createAction(
  async ({ query }: { query: string }) => {
    noStore()

    if (query.length === 0) return null

    const categoriesWithProducts = await db.query.categories.findMany({
      columns: {
        id: true,
        name: true,
      },
      with: {
        products: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      // This doesn't do anything
      where: (table, { sql }) => sql`position(${query} in ${table.name}) > 0`,
    })

    return categoriesWithProducts
  }
)

export const addProduct = createAction(
  async (
    input: Omit<CreateProductSchema, "images"> & {
      storeId: string
      images: StoredFile[]
    }
  ) => {
    const productWithSameName = await db.query.products.findFirst({
      columns: {
        id: true,
      },
      where: eq(products.name, input.name),
    })

    if (productWithSameName) {
      throw new Error("Product name already taken.")
    }

    await db.insert(products).values({
      ...input,
      images: JSON.stringify(input.images) as unknown as StoredFile[],
    })

    revalidatePath(`/dashboard/stores/${input.storeId}/products.`)

    return null
  }
)

export const updateProduct = createAction(
  async (
    input: z.infer<typeof createProductSchema> & {
      id: string
      storeId: string
    }
  ) => {
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, input.id),
        eq(products.storeId, input.storeId)
      ),
    })

    if (!product) {
      throw new Error("Product not found.")
    }

    await db
      .update(products)
      .set({
        ...input,
        images: JSON.stringify(input.images) as unknown as StoredFile[],
      })
      .where(eq(products.id, input.id))

    revalidatePath(`/dashboard/stores/${input.storeId}/products/${input.id}`)

    return null
  }
)

export const updateProductRating = createAction(
  async (input: z.infer<typeof updateProductRatingSchema>) => {
    const product = await db.query.products.findFirst({
      columns: {
        id: true,
        rating: true,
      },
      where: eq(products.id, input.id),
    })

    if (!product) {
      throw new Error("Product not found.")
    }

    await db
      .update(products)
      .set({ rating: input.rating })
      .where(eq(products.id, input.id))

    revalidatePath("/")

    return null
  }
)

export const deleteProduct = createAction(
  async (input: { id: string; storeId: string }) => {
    const product = await db.query.products.findFirst({
      columns: {
        id: true,
      },
      where: and(
        eq(products.id, input.id),
        eq(products.storeId, input.storeId)
      ),
    })

    if (!product) {
      throw new Error("Product not found.")
    }

    await db.delete(products).where(eq(products.id, input.id))

    revalidatePath(`/dashboard/stores/${input.storeId}/products`)

    return null
  }
)
