import * as z from "zod"

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(5000).optional(),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().max(5000).optional(),
})

export type CreateReviewSchema = z.infer<typeof createReviewSchema>
export type UpdateReviewSchema = z.infer<typeof updateReviewSchema>
