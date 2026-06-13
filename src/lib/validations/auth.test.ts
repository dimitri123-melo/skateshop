import { describe, expect, it } from "vitest"

import {
  authSchema,
  checkEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth"

describe("authSchema", () => {
  it("accepts valid email and password", () => {
    const result = authSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = authSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("rejects short password", () => {
    const result = authSchema.safeParse({
      email: "test@example.com",
      password: "short",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain("at least 8")
    }
  })

  it("rejects password over 100 chars", () => {
    const result = authSchema.safeParse({
      email: "test@example.com",
      password: "a".repeat(101),
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain("at most 100")
    }
  })

  it("rejects missing fields", () => {
    const result = authSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("verifyEmailSchema", () => {
  it("accepts a 6-character code", () => {
    const result = verifyEmailSchema.safeParse({ code: "123456" })
    expect(result.success).toBe(true)
  })

  it("rejects a code shorter than 6 characters", () => {
    const result = verifyEmailSchema.safeParse({ code: "123" })
    expect(result.success).toBe(false)
  })

  it("rejects a code longer than 6 characters", () => {
    const result = verifyEmailSchema.safeParse({ code: "1234567" })
    expect(result.success).toBe(false)
  })
})

describe("checkEmailSchema", () => {
  it("accepts valid email", () => {
    const result = checkEmailSchema.safeParse({ email: "test@example.com" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = checkEmailSchema.safeParse({ email: "invalid" })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("accepts matching passwords and valid code", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "password123",
      code: "123456",
    })
    expect(result.success).toBe(true)
  })

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "different456",
      code: "123456",
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message)
      expect(messages).toContain("Passwords do not match")
    }
  })
})
