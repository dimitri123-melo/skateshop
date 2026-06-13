import { describe, expect, it } from "vitest"

import {
  createProductSchema,
  filterProductsSchema,
  getProductInventorySchema,
  getProductsSchema,
  updateProductRatingSchema,
  updateProductSchema,
} from "./product"

describe("createProductSchema", () => {
  it("accepts valid product", () => {
    const result = createProductSchema.safeParse({
      name: "Pro Skateboard",
      categoryId: "cat_1",
      price: "49.99",
      inventory: 100,
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty name", () => {
    const result = createProductSchema.safeParse({
      name: "",
      categoryId: "cat_1",
      price: "49.99",
      inventory: 100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid price format", () => {
    const result = createProductSchema.safeParse({
      name: "Skateboard",
      categoryId: "cat_1",
      price: "not-a-price",
      inventory: 100,
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional description and subcategoryId", () => {
    const result = createProductSchema.safeParse({
      name: "Skateboard",
      categoryId: "cat_1",
      price: "49.99",
      inventory: 100,
      description: "A great skateboard",
      subcategoryId: "sub_1",
    })
    expect(result.success).toBe(true)
  })

  it("accepts null subcategoryId", () => {
    const result = createProductSchema.safeParse({
      name: "Skateboard",
      categoryId: "cat_1",
      price: "49.99",
      inventory: 100,
      subcategoryId: null,
    })
    expect(result.success).toBe(true)
  })

  it("accepts whole number price", () => {
    const result = createProductSchema.safeParse({
      name: "Skateboard",
      categoryId: "cat_1",
      price: "50",
      inventory: 10,
    })
    expect(result.success).toBe(true)
  })

  it("rejects price with 3 decimals", () => {
    const result = createProductSchema.safeParse({
      name: "Skateboard",
      categoryId: "cat_1",
      price: "49.999",
      inventory: 100,
    })
    expect(result.success).toBe(false)
  })
})

describe("updateProductSchema", () => {
  it("requires id field", () => {
    const result = updateProductSchema.safeParse({
      name: "Updated Board",
      categoryId: "cat_1",
      price: "59.99",
      inventory: 50,
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid update", () => {
    const result = updateProductSchema.safeParse({
      id: "prd_123",
      name: "Updated Board",
      categoryId: "cat_1",
      price: "59.99",
      inventory: 50,
    })
    expect(result.success).toBe(true)
  })
})

describe("filterProductsSchema", () => {
  it("accepts valid query", () => {
    const result = filterProductsSchema.safeParse({ query: "skateboard" })
    expect(result.success).toBe(true)
  })

  it("rejects missing query", () => {
    const result = filterProductsSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("getProductInventorySchema", () => {
  it("accepts valid id", () => {
    const result = getProductInventorySchema.safeParse({ id: "prd_123" })
    expect(result.success).toBe(true)
  })
})

describe("getProductsSchema", () => {
  it("applies defaults", () => {
    const result = getProductsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.per_page).toBe(10)
      expect(result.data.sort).toBe("createdAt.desc")
      expect(result.data.active).toBe("true")
      expect(result.data.store_page).toBe(1)
    }
  })

  it("accepts custom pagination", () => {
    const result = getProductsSchema.safeParse({ page: 3, per_page: 20 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.per_page).toBe(20)
    }
  })

  it("coerces string numbers", () => {
    const result = getProductsSchema.safeParse({ page: "5", per_page: "25" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(5)
      expect(result.data.per_page).toBe(25)
    }
  })
})

describe("updateProductRatingSchema", () => {
  it("accepts valid rating", () => {
    const result = updateProductRatingSchema.safeParse({
      id: "prd_123",
      rating: 4.5,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing id", () => {
    const result = updateProductRatingSchema.safeParse({ rating: 4.5 })
    expect(result.success).toBe(false)
  })
})
