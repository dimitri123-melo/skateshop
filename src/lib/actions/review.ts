"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { products, reviews } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, avg, count, desc, eq } from "drizzle-orm"

import { getErrorMessage } from "@/lib/handle-error"
import { logger } from "@/lib/logger"
import {
  createReviewSchema,
  updateReviewSchema,
  type CreateReviewSchema,
  type UpdateReviewSchema,
} from "@/lib/validations/review"

export async function getProductReviews(productId: string) {
  try {
    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))

    return { data: productReviews, error: null }
  } catch (err) {
    logger.error("Failed to fetch reviews", { action: "getProductReviews", error: err })
    return { data: [], error: getErrorMessage(err) }
  }
}

export async function getProductRatingStats(productId: string) {
  try {
    const stats = await db
      .select({
        averageRating: avg(reviews.rating),
        totalReviews: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .then((res) => res[0])

    return {
      data: {
        averageRating: Number(stats?.averageRating ?? 0),
        totalReviews: stats?.totalReviews ?? 0,
      },
      error: null,
    }
  } catch (err) {
    return {
      data: { averageRating: 0, totalReviews: 0 },
      error: getErrorMessage(err),
    }
  }
}

export async function createReview(input: CreateReviewSchema) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("You must be signed in to leave a review")
    }

    const parsed = createReviewSchema.parse(input)

    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, userId),
        eq(reviews.productId, parsed.productId)
      ),
    })

    if (existingReview) {
      throw new Error("You have already reviewed this product")
    }

    await db.insert(reviews).values({
      userId,
      productId: parsed.productId,
      rating: parsed.rating,
      title: parsed.title,
      body: parsed.body,
    })

    // Update product average rating
    const ratingStats = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.productId, parsed.productId))
      .then((res) => res[0])

    if (ratingStats?.avg) {
      await db
        .update(products)
        .set({ rating: Math.round(Number(ratingStats.avg)) })
        .where(eq(products.id, parsed.productId))
    }

    revalidatePath(`/product/${parsed.productId}`)

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}

export async function updateReview(
  reviewId: string,
  input: UpdateReviewSchema
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const parsed = updateReviewSchema.parse(input)

    const review = await db.query.reviews.findFirst({
      where: and(eq(reviews.id, reviewId), eq(reviews.userId, userId)),
    })

    if (!review) {
      throw new Error("Review not found")
    }

    await db
      .update(reviews)
      .set(parsed)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))

    revalidatePath(`/product/${review.productId}`)

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}

export async function deleteReview(reviewId: string) {
  try {
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    const review = await db.query.reviews.findFirst({
      where: and(eq(reviews.id, reviewId), eq(reviews.userId, userId)),
    })

    if (!review) {
      throw new Error("Review not found")
    }

    await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))

    revalidatePath(`/product/${review.productId}`)

    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: getErrorMessage(err) }
  }
}
