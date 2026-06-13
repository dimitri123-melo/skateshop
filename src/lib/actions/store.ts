"use server"

import {
  unstable_noStore as noStore,
  revalidatePath,
  revalidateTag,
} from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { stores } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, desc, eq, not } from "drizzle-orm"

import { getErrorMessage } from "@/lib/handle-error"
import { slugify } from "@/lib/utils"
import {
  updateStoreSchema,
  type CreateStoreSchema,
} from "@/lib/validations/store"

export async function createStore(input: CreateStoreSchema) {
  noStore()
  try {
    const { userId } = auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const newStore = await db
      .insert(stores)
      .values({
        name: input.name,
        description: input.description,
        userId,
        slug: slugify(input.name),
      })
      .returning({
        id: stores.id,
        slug: stores.slug,
      })
      .then((res) => res[0])

    revalidateTag(`stores-${userId}`)

    return {
      data: newStore,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function updateStore(storeId: string, fd: FormData) {
  noStore()
  try {
    const { userId } = auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const input = updateStoreSchema.parse({
      name: fd.get("name"),
      description: fd.get("description"),
    })

    const storeWithSameName = await db.query.stores.findFirst({
      where: and(eq(stores.name, input.name), not(eq(stores.id, storeId))),
      columns: {
        id: true,
      },
    })

    if (storeWithSameName) {
      throw new Error("Store name already taken")
    }

    await db
      .update(stores)
      .set({
        name: input.name,
        description: input.description,
      })
      .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))

    revalidatePath(`/store/${storeId}`)

    return {
      data: null,
      error: null,
    }
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    }
  }
}

export async function deleteStore(storeId: string) {
  const { userId } = auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const allStores = await db
    .select({
      id: stores.id,
      userId: stores.userId,
    })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))
    .orderBy(desc(stores.createdAt))

  // if (allStores.length < 2) {
  //   throw new Error("Can't delete the only store")
  // }

  if (!allStores.length) {
    throw new Error("Store not found or unauthorized")
  }

  await db
    .delete(stores)
    .where(and(eq(stores.id, storeId), eq(stores.userId, userId)))

  revalidateTag(`stores-${userId}`)

  redirect(`/store/${allStores[1]?.id}`)
}
