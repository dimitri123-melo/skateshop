import { describe, expect, it } from "vitest"

import { generateId } from "./id"

describe("generateId", () => {
  it("generates an id without prefix", () => {
    const id = generateId()
    expect(id).toHaveLength(12)
    expect(id).toMatch(/^[0-9A-Za-z]+$/)
  })

  it("generates an id with store prefix", () => {
    const id = generateId("store")
    expect(id).toMatch(/^str_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with product prefix", () => {
    const id = generateId("product")
    expect(id).toMatch(/^prd_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with cart prefix", () => {
    const id = generateId("cart")
    expect(id).toMatch(/^crt_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with category prefix", () => {
    const id = generateId("category")
    expect(id).toMatch(/^cat_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with order prefix", () => {
    const id = generateId("order")
    expect(id).toMatch(/^ord_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with payment prefix", () => {
    const id = generateId("payment")
    expect(id).toMatch(/^pay_[0-9A-Za-z]{12}$/)
  })

  it("generates an id with notification prefix", () => {
    const id = generateId("notification")
    expect(id).toMatch(/^not_[0-9A-Za-z]{12}$/)
  })

  it("respects custom length", () => {
    const id = generateId("store", { length: 8 })
    expect(id).toMatch(/^str_[0-9A-Za-z]{8}$/)
  })

  it("respects custom separator", () => {
    const id = generateId("store", { separator: "-" })
    expect(id).toMatch(/^str-[0-9A-Za-z]{12}$/)
  })

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
