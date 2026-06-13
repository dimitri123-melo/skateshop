import { describe, expect, it, vi } from "vitest"
import * as z from "zod"

vi.mock("@clerk/nextjs/errors", () => ({
  isClerkAPIResponseError: (err: unknown) =>
    typeof err === "object" &&
    err !== null &&
    "clerkError" in err &&
    (err as Record<string, unknown>).clerkError === true,
}))

import { unknownError } from "@/lib/constants"

import { getErrorMessage } from "./handle-error"

describe("getErrorMessage", () => {
  it("extracts message from ZodError", () => {
    const schema = z.object({ name: z.string().min(1, "Name is required") })
    const result = schema.safeParse({ name: "" })

    if (!result.success) {
      expect(getErrorMessage(result.error)).toBe("Name is required")
    }
  })

  it("extracts message from generic Error", () => {
    const err = new Error("Something broke")
    expect(getErrorMessage(err)).toBe("Something broke")
  })

  it("returns unknownError for non-Error objects", () => {
    expect(getErrorMessage("string error")).toBe(unknownError)
  })

  it("returns unknownError for null", () => {
    expect(getErrorMessage(null)).toBe(unknownError)
  })

  it("returns unknownError for undefined", () => {
    expect(getErrorMessage(undefined)).toBe(unknownError)
  })

  it("returns unknownError for number", () => {
    expect(getErrorMessage(42)).toBe(unknownError)
  })

  it("returns unknownError for plain object", () => {
    expect(getErrorMessage({ msg: "fail" })).toBe(unknownError)
  })

  it("extracts first message from ZodError with multiple issues", () => {
    const schema = z.object({
      name: z.string().min(1, "Name required"),
      age: z.number().min(0, "Age must be positive"),
    })
    const result = schema.safeParse({ name: "", age: -1 })

    if (!result.success) {
      const msg = getErrorMessage(result.error)
      expect(msg).toBe("Name required")
    }
  })
})
