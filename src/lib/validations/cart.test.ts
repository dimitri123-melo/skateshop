import { describe, expect, it } from "vitest"

import {
  cartItemSchema,
  cartLineItemSchema,
  checkoutItemSchema,
  deleteCartItemSchema,
  deleteCartItemsSchema,
  updateCartItemSchema,
} from "./cart"

describe("cartItemSchema", () => {
  it("accepts valid cart item", () => {
    const result = cartItemSchema.safeParse({
      productId: "prod_123",
      quantity: 2,
    })
    expect(result.success).toBe(true)
  })

  it("accepts zero quantity", () => {
    const result = cartItemSchema.safeParse({
      productId: "prod_123",
      quantity: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative quantity", () => {
    const result = cartItemSchema.safeParse({
      productId: "prod_123",
      quantity: -1,
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional subcategoryId", () => {
    const result = cartItemSchema.safeParse({
      productId: "prod_123",
      quantity: 1,
      subcategoryId: "sub_1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing productId", () => {
    const result = cartItemSchema.safeParse({ quantity: 1 })
    expect(result.success).toBe(false)
  })
})

describe("checkoutItemSchema", () => {
  it("accepts valid checkout item with price", () => {
    const result = checkoutItemSchema.safeParse({
      productId: "prod_123",
      quantity: 1,
      price: 29.99,
    })
    expect(result.success).toBe(true)
  })

  it("rejects checkout item without price", () => {
    const result = checkoutItemSchema.safeParse({
      productId: "prod_123",
      quantity: 1,
    })
    expect(result.success).toBe(false)
  })
})

describe("cartLineItemSchema", () => {
  it("accepts valid cart line item", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "29.99",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid price format", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "abc",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
    })
    expect(result.success).toBe(false)
  })

  it("accepts price with two decimals", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "100.50",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
    })
    expect(result.success).toBe(true)
  })

  it("rejects price with three decimals", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "100.501",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
    })
    expect(result.success).toBe(false)
  })

  it("accepts whole number price", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "100",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts nullable optional fields", () => {
    const result = cartLineItemSchema.safeParse({
      id: "1",
      name: "Skateboard",
      price: "29.99",
      inventory: 10,
      quantity: 1,
      storeId: "store_1",
      images: null,
      category: null,
      subcategory: null,
      storeName: null,
      storeStripeAccountId: null,
    })
    expect(result.success).toBe(true)
  })
})

describe("deleteCartItemSchema", () => {
  it("accepts valid productId", () => {
    const result = deleteCartItemSchema.safeParse({ productId: "prod_123" })
    expect(result.success).toBe(true)
  })

  it("rejects missing productId", () => {
    const result = deleteCartItemSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("deleteCartItemsSchema", () => {
  it("accepts array of product IDs", () => {
    const result = deleteCartItemsSchema.safeParse({
      productIds: ["prod_1", "prod_2"],
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty array", () => {
    const result = deleteCartItemsSchema.safeParse({ productIds: [] })
    expect(result.success).toBe(true)
  })
})

describe("updateCartItemSchema", () => {
  it("accepts valid quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: 5 })
    expect(result.success).toBe(true)
  })

  it("defaults quantity to 1", () => {
    const result = updateCartItemSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quantity).toBe(1)
    }
  })

  it("rejects negative quantity", () => {
    const result = updateCartItemSchema.safeParse({ quantity: -1 })
    expect(result.success).toBe(false)
  })
})
