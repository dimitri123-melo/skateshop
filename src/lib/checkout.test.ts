import { describe, expect, it, vi } from "vitest"

vi.mock("@/env.js", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://skateshop.example.com",
  },
}))

import type { CartLineItemSchema } from "@/lib/validations/cart"

import { calculateOrderAmount, getStripePaymentStatusColor } from "./checkout"

describe("calculateOrderAmount", () => {
  it("calculates total and fee for a single item", () => {
    const items: CartLineItemSchema[] = [
      {
        id: "1",
        name: "Skateboard",
        price: "29.99",
        inventory: 10,
        quantity: 1,
        storeId: "store1",
      },
    ]
    const result = calculateOrderAmount(items)
    expect(result.total).toBe(2999)
    expect(result.fee).toBe(30)
  })

  it("calculates total and fee for multiple items", () => {
    const items: CartLineItemSchema[] = [
      {
        id: "1",
        name: "Skateboard",
        price: "10.00",
        inventory: 10,
        quantity: 2,
        storeId: "store1",
      },
      {
        id: "2",
        name: "Wheels",
        price: "5.00",
        inventory: 5,
        quantity: 3,
        storeId: "store1",
      },
    ]
    const result = calculateOrderAmount(items)
    // total = (10*2 + 5*3) = 35, in cents = 3500
    expect(result.total).toBe(3500)
    // fee = 35 * 0.01 = 0.35, in cents = 35
    expect(result.fee).toBe(35)
  })

  it("returns zero for empty cart", () => {
    const result = calculateOrderAmount([])
    expect(result.total).toBe(0)
    expect(result.fee).toBe(0)
  })

  it("handles zero quantity items", () => {
    const items: CartLineItemSchema[] = [
      {
        id: "1",
        name: "Skateboard",
        price: "29.99",
        inventory: 10,
        quantity: 0,
        storeId: "store1",
      },
    ]
    const result = calculateOrderAmount(items)
    expect(result.total).toBe(0)
    expect(result.fee).toBe(0)
  })
})

describe("getStripePaymentStatusColor", () => {
  it("returns green for succeeded status", () => {
    const result = getStripePaymentStatusColor({ status: "succeeded" })
    expect(result).toContain("green")
  })

  it("returns red for canceled status", () => {
    const result = getStripePaymentStatusColor({ status: "canceled" })
    expect(result).toContain("red")
  })

  it("returns yellow for processing status", () => {
    const result = getStripePaymentStatusColor({ status: "processing" })
    expect(result).toContain("yellow")
  })

  it("returns yellow for requires_action status", () => {
    const result = getStripePaymentStatusColor({ status: "requires_action" })
    expect(result).toContain("yellow")
  })

  it("returns yellow for requires_payment_method status", () => {
    const result = getStripePaymentStatusColor({
      status: "requires_payment_method",
    })
    expect(result).toContain("yellow")
  })

  it("respects custom shade", () => {
    const result = getStripePaymentStatusColor({
      status: "succeeded",
      shade: 400,
    })
    expect(result).toContain("green-400")
  })
})
