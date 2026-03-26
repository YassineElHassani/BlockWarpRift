import { describe, it, expect } from "vitest"

function getStatusClass(status: string): string {
  const styles: Record<string, string> = {
    PAID: "bg-green-50 text-green-700",
    PENDING: "bg-amber-50 text-amber-700",
    EXPIRED: "bg-gray-100 text-gray-500",
    FAILED: "bg-red-50 text-red-600",
  }
  return styles[status] ?? "bg-gray-100 text-gray-500"
}

function formatPaymentAmount(amount: number, currency: string): string {
  return `${amount} ${currency}`
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

describe("Payment status badge classes", () => {
  it("returns green classes for PAID", () => {
    expect(getStatusClass("PAID")).toBe("bg-green-50 text-green-700")
  })

  it("returns amber classes for PENDING", () => {
    expect(getStatusClass("PENDING")).toBe("bg-amber-50 text-amber-700")
  })

  it("returns gray classes for EXPIRED", () => {
    expect(getStatusClass("EXPIRED")).toBe("bg-gray-100 text-gray-500")
  })

  it("returns red classes for FAILED", () => {
    expect(getStatusClass("FAILED")).toBe("bg-red-50 text-red-600")
  })

  it("returns fallback gray for unknown status", () => {
    expect(getStatusClass("UNKNOWN")).toBe("bg-gray-100 text-gray-500")
  })
})

describe("formatPaymentAmount()", () => {
  it("formats ETH amount correctly", () => {
    expect(formatPaymentAmount(0.1, "ETH")).toBe("0.1 ETH")
  })

  it("formats small amounts correctly", () => {
    expect(formatPaymentAmount(0.000011, "ETH")).toBe("0.000011 ETH")
  })
})

describe("isExpired()", () => {
  it("returns true for a past date", () => {
    expect(isExpired("2020-01-01T00:00:00Z")).toBe(true)
  })

  it("returns false for a future date", () => {
    expect(isExpired("2099-01-01T00:00:00Z")).toBe(false)
  })
})
