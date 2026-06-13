import { describe, expect, it, vi } from "vitest"

vi.mock("@/env.js", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "https://skateshop.example.com",
  },
}))

import {
  absoluteUrl,
  cn,
  formatBytes,
  formatDate,
  formatId,
  formatNumber,
  formatPrice,
  isMacOs,
  slugify,
  toSentenceCase,
  toTitleCase,
  truncate,
  unslugify,
} from "./utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles tailwind merge conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null)).toBe("base")
  })
})

describe("absoluteUrl", () => {
  it("prepends the app URL to a path", () => {
    expect(absoluteUrl("/products")).toBe(
      "https://skateshop.example.com/products"
    )
  })

  it("handles root path", () => {
    expect(absoluteUrl("/")).toBe("https://skateshop.example.com/")
  })

  it("handles nested paths", () => {
    expect(absoluteUrl("/dashboard/stores/123")).toBe(
      "https://skateshop.example.com/dashboard/stores/123"
    )
  })
})

describe("formatPrice", () => {
  it("formats a number as USD currency", () => {
    const result = formatPrice(1234)
    expect(result).toContain("$")
    expect(result).toContain("1")
  })

  it("formats a string price", () => {
    const result = formatPrice("29.99")
    expect(result).toContain("$")
  })

  it("formats zero", () => {
    const result = formatPrice(0)
    expect(result).toContain("$")
    expect(result).toContain("0")
  })

  it("respects custom notation", () => {
    const result = formatPrice(1234, { notation: "standard" })
    expect(result).toContain("1,234")
  })

  it("respects custom currency", () => {
    const result = formatPrice(10, { currency: "EUR", notation: "standard" })
    expect(result).toContain("€")
  })
})

describe("formatNumber", () => {
  it("formats an integer", () => {
    expect(formatNumber(1234)).toBe("1,234")
  })

  it("formats a decimal to 2 places max", () => {
    expect(formatNumber(1234.567)).toBe("1,234.57")
  })

  it("formats a string number", () => {
    expect(formatNumber("5678")).toBe("5,678")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })

  it("respects compact notation", () => {
    const result = formatNumber(1500, { notation: "compact" })
    expect(result).toContain("1")
    expect(result).toContain("K")
  })
})

describe("formatDate", () => {
  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-01-15"))
    expect(result).toContain("January")
    expect(result).toContain("2024")
  })

  it("formats a date string", () => {
    const result = formatDate("2024-06-01")
    expect(result).toContain("2024")
  })

  it("formats a timestamp number", () => {
    const result = formatDate(0)
    expect(result).toContain("1970")
  })

  it("respects custom options", () => {
    const result = formatDate(new Date("2024-01-15"), { month: "short" })
    expect(result).toContain("Jan")
  })
})

describe("formatBytes", () => {
  it("formats 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Byte")
  })

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 Bytes")
  })

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB")
  })

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1 MB")
  })

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1 GB")
  })

  it("respects decimal places", () => {
    expect(formatBytes(1536, 2)).toBe("1.50 KB")
  })

  it("uses accurate sizes when specified", () => {
    expect(formatBytes(1024, 0, "accurate")).toBe("1 KiB")
  })

  it("uses accurate sizes for MB", () => {
    expect(formatBytes(1048576, 0, "accurate")).toBe("1 MiB")
  })
})

describe("formatId", () => {
  it("formats a short id with padding", () => {
    expect(formatId("1")).toBe("#0001")
  })

  it("formats a 4-digit id without padding", () => {
    expect(formatId("1234")).toBe("#1234")
  })

  it("formats a longer id as-is", () => {
    expect(formatId("12345")).toBe("#12345")
  })
})

describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world")
  })

  it("lowercases the string", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("hello   world")).toBe("hello-world")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})

describe("unslugify", () => {
  it("converts hyphens to spaces", () => {
    expect(unslugify("hello-world")).toBe("hello world")
  })

  it("handles multiple hyphens", () => {
    expect(unslugify("one-two-three")).toBe("one two three")
  })

  it("handles string without hyphens", () => {
    expect(unslugify("hello")).toBe("hello")
  })
})

describe("toTitleCase", () => {
  it("capitalizes each word", () => {
    expect(toTitleCase("hello world")).toBe("Hello World")
  })

  it("handles single word", () => {
    expect(toTitleCase("hello")).toBe("Hello")
  })

  it("lowercases remaining letters", () => {
    expect(toTitleCase("HELLO WORLD")).toBe("Hello World")
  })
})

describe("toSentenceCase", () => {
  it("converts camelCase to sentence case", () => {
    expect(toSentenceCase("helloWorld")).toBe("Hello World")
  })

  it("converts PascalCase to sentence case", () => {
    expect(toSentenceCase("HelloWorld")).toBe(" Hello World")
  })

  it("handles single word", () => {
    expect(toSentenceCase("hello")).toBe("Hello")
  })
})

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("hello world", 5)).toBe("hello...")
  })

  it("does not truncate short strings", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })
})

describe("isMacOs", () => {
  it("returns false when window is undefined (server-side)", () => {
    expect(isMacOs()).toBe(false)
  })
})
