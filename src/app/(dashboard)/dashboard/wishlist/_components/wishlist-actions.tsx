"use client"

import * as React from "react"
import { TrashIcon } from "@radix-ui/react-icons"
import { toast } from "sonner"

import { removeFromWishlist } from "@/lib/actions/wishlist"
import { Button } from "@/components/ui/button"

interface WishlistActionsProps {
  productId: string
}

export function WishlistActions({ productId }: WishlistActionsProps) {
  const [isPending, startTransition] = React.useTransition()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const { error } = await removeFromWishlist(productId)
          if (error) {
            toast.error(error)
            return
          }
          toast.success("Removed from wishlist")
        })
      }}
    >
      <TrashIcon className="size-4" aria-hidden="true" />
      <span className="sr-only">Remove from wishlist</span>
    </Button>
  )
}
