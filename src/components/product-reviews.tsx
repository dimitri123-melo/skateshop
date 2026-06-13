"use client"

import * as React from "react"
import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { createReview, deleteReview } from "@/lib/actions/review"
import { formatDate } from "@/lib/utils"
import type { Review } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProductReviewsProps {
  productId: string
  reviews: Review[]
  averageRating: number
  totalReviews: number
  isSignedIn: boolean
}

function StarRating({
  rating,
  onSelect,
  interactive = false,
}: {
  rating: number
  onSelect?: (rating: number) => void
  interactive?: boolean
}) {
  const [hoveredRating, setHoveredRating] = React.useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= (hoveredRating || rating)

        return interactive ? (
          <button
            key={i}
            type="button"
            className="text-yellow-500 hover:scale-110 transition-transform"
            onClick={() => onSelect?.(starValue)}
            onMouseEnter={() => setHoveredRating(starValue)}
            onMouseLeave={() => setHoveredRating(0)}
          >
            {isFilled ? (
              <StarFilledIcon className="size-5" />
            ) : (
              <StarIcon className="size-5" />
            )}
          </button>
        ) : (
          <span key={i} className="text-yellow-500">
            {isFilled ? (
              <StarFilledIcon className="size-4" />
            ) : (
              <StarIcon className="size-4" />
            )}
          </span>
        )
      })}
    </div>
  )
}

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  totalReviews,
  isSignedIn,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [rating, setRating] = React.useState(0)
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    startTransition(async () => {
      const { error } = await createReview({
        productId,
        rating,
        title: title || undefined,
        body: body || undefined,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success("Review submitted!")
      setShowForm(false)
      setRating(0)
      setTitle("")
      setBody("")
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={Math.round(averageRating)} />
            <span className="text-sm text-muted-foreground">
              {averageRating.toFixed(1)} ({totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
        {isSignedIn && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Rating</label>
                <StarRating
                  rating={rating}
                  onSelect={setRating}
                  interactive
                />
              </div>
              <div>
                <Input
                  placeholder="Review title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Write your review..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <StarRating rating={review.rating} />
                    {review.title && (
                      <h4 className="mt-1 font-medium">{review.title}</h4>
                    )}
                  </div>
                  <CardDescription>
                    {formatDate(review.createdAt.toISOString())}
                  </CardDescription>
                </div>
                {review.body && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.body}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="py-8 text-center text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </p>
        )
      )}
    </div>
  )
}
