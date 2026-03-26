import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn()", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-sm")).toBe("text-sm")
  })

  it("merges multiple classes", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold")
  })

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
  })

  it("ignores falsy values", () => {
    expect(cn("text-sm", false, undefined, null, "")).toBe("text-sm")
  })

  it("handles conditional classes", () => {
    const isActive = true
    expect(cn("base", isActive && "active")).toBe("base active")
  })

  it("handles object syntax", () => {
    expect(cn({ "font-bold": true, "font-light": false })).toBe("font-bold")
  })
})
