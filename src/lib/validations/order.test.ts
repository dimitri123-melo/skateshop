import { describe, expect, it } from "vitest"

import { getOrderLineItemsSchema, verifyOrderSchema } from "./order"

describe("getOrderLineItemsSchema", () => {
  it("accepts valid order line items query", () => {
    const result = getOrderLineItemsSchema.safeParse({
      storeId: "store_123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts optional items string", () => {
    const result = getOrderLineItemsSchema.safeParse({
      storeId: "store_123",
      items: "item1,item2",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing storeId", () => {
    const result = getOrderLineItemsSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("verifyOrderSchema", () => {
  it("accepts valid postal code", () => {
    const result = verifyOrderSchema.safeParse({
      deliveryPostalCode: "12345",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty postal code", () => {
    const result = verifyOrderSchema.safeParse({
      deliveryPostalCode: "",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain("valid postal code")
    }
  })

  it("rejects missing postal code", () => {
    const result = verifyOrderSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
