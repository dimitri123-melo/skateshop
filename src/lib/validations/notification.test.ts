import { describe, expect, it } from "vitest"

import {
  emailSchema,
  joinNewsletterSchema,
  updateNotificationSchema,
} from "./notification"

describe("emailSchema", () => {
  it("accepts valid email", () => {
    const result = emailSchema.safeParse({ email: "test@example.com" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = emailSchema.safeParse({ email: "not-email" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain("valid email")
    }
  })

  it("rejects empty string", () => {
    const result = emailSchema.safeParse({ email: "" })
    expect(result.success).toBe(false)
  })
})

describe("joinNewsletterSchema", () => {
  it("accepts valid newsletter subscription", () => {
    const result = joinNewsletterSchema.safeParse({
      email: "test@example.com",
      token: "abc123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing token", () => {
    const result = joinNewsletterSchema.safeParse({
      email: "test@example.com",
    })
    expect(result.success).toBe(false)
  })

  it("accepts optional subject", () => {
    const result = joinNewsletterSchema.safeParse({
      email: "test@example.com",
      token: "abc123",
      subject: "Welcome!",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateNotificationSchema", () => {
  it("accepts valid notification preferences", () => {
    const result = updateNotificationSchema.safeParse({
      token: "abc123",
      communication: true,
      newsletter: false,
      marketing: true,
    })
    expect(result.success).toBe(true)
  })

  it("applies defaults for boolean fields", () => {
    const result = updateNotificationSchema.safeParse({
      token: "abc123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing token", () => {
    const result = updateNotificationSchema.safeParse({
      communication: true,
    })
    expect(result.success).toBe(false)
  })
})
