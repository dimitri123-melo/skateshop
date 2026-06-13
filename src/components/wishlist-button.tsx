"use client"

import * as React from "react"
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { addToWishlist, removeFromWishlist } from "@/lib/actions/wishlist"
import { Button } from "@/components/ui/button"

interface WishlistButtonProps {
  productId: string
  isWishlisted?: boolean
}

export function WishlistButton({
  productId,
  isWishlisted = false,
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = React.useState(isWishlisted)
  const [isPending, startTransition] = React.useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 shrink-0"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        startTransition(async () => {
          if (isInWishlist) {
            const { error } = await removeFromWishlist(productId)
            if (error) {
              toast.error(error)
              return
            }
            setIsInWishlist(false)
            toast.success("Removed from wishlist")
          } else {
            const { error } = await addToWishlist(productId)
            if (error) {
              toast.error(error)
              return
            }
            setIsInWishlist(true)
            toast.success("Added to wishlist")
          }
        })
      }}
    >
      {isInWishlist ? (
        <HeartFilledIcon className="size-4 text-red-500" aria-hidden="true" />
      ) : (
        <HeartIcon className="size-4" aria-hidden="true" />
      )}
      <span className="sr-only">
        {isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      </span>
    </Button>
  )
}
