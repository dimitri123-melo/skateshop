import { type Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { getWishlist } from "@/lib/actions/wishlist"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/page-header"
import { Shell } from "@/components/shell"

import { WishlistActions } from "./_components/wishlist-actions"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Manage your wishlist",
}

export default async function WishlistPage() {
  const { data: wishlistItems } = await getWishlist()

  return (
    <Shell variant="sidebar">
      <PageHeader>
        <PageHeaderHeading size="sm">Wishlist</PageHeaderHeading>
        <PageHeaderDescription size="sm">
          {wishlistItems.length === 0
            ? "Your wishlist is empty"
            : `${wishlistItems.length} item${wishlistItems.length === 1 ? "" : "s"} in your wishlist`}
        </PageHeaderDescription>
      </PageHeader>
      {wishlistItems.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="p-0">
                <Link href={`/product/${item.productId}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    {item.productImages?.[0]?.url ? (
                      <Image
                        src={item.productImages[0].url}
                        alt={item.productName ?? "Product"}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="p-4">
                <Link href={`/product/${item.productId}`}>
                  <CardTitle className="line-clamp-1 text-base">
                    {item.productName}
                  </CardTitle>
                </Link>
                <CardDescription className="mt-1">
                  {item.storeName}
                </CardDescription>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold">
                    {formatPrice(Number(item.productPrice))}
                  </span>
                  <WishlistActions productId={item.productId} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="mb-4 text-muted-foreground">
              Browse products and add them to your wishlist
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </Shell>
  )
}
