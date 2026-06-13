import { describe, expect, it, vi } from "vitest"

vi.mock("@/env.js", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://skateshop.example.com",
  },
}))

import {
  createStoreSchema,
  getStoreSchema,
  getStoresSchema,
  updateStoreSchema,
} from "./store"

describe("createStoreSchema", () => {
  it("accepts valid store with auto-generated slug", () => {
    const result = createStoreSchema.safeParse({
      name: "My Skate Shop",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.slug).toBe("my-skate-shop")
    }
  })

  it("accepts custom slug", () => {
    const result = createStoreSchema.safeParse({
      name: "My Skate Shop",
      slug: "custom-slug",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.slug).toBe("custom-slug")
    }
  })

  it("rejects name shorter than 3 chars", () => {
    const result = createStoreSchema.safeParse({ name: "AB" })
    expect(result.success).toBe(false)
  })

  it("rejects name longer than 50 chars", () => {
    const result = createStoreSchema.safeParse({ name: "A".repeat(51) })
    expect(result.success).toBe(false)
  })

  it("accepts optional description", () => {
    const result = createStoreSchema.safeParse({
      name: "My Shop",
      description: "Best skate shop in town",
    })
    expect(result.success).toBe(true)
  })
})

describe("getStoreSchema", () => {
  it("accepts valid store query", () => {
    const result = getStoreSchema.safeParse({
      id: 1,
      userId: "user_123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing userId", () => {
    const result = getStoreSchema.safeParse({ id: 1 })
    expect(result.success).toBe(false)
  })
})

describe("getStoresSchema", () => {
  it("applies defaults", () => {
    const result = getStoresSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.per_page).toBe(10)
      expect(result.data.sort).toBe("productCount.desc")
      expect(result.data.active).toBe("true")
    }
  })
})

describe("updateStoreSchema", () => {
  it("accepts valid update", () => {
    const result = updateStoreSchema.safeParse({
      name: "Updated Shop",
    })
    expect(result.success).toBe(true)
  })

  it("rejects short name", () => {
    const result = updateStoreSchema.safeParse({ name: "AB" })
    expect(result.success).toBe(false)
  })

  it("rejects long name", () => {
    const result = updateStoreSchema.safeParse({ name: "X".repeat(51) })
    expect(result.success).toBe(false)
  })
})
