import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/store/auth.store"

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  role: "MERCHANT",
}

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  })

  it("starts unauthenticated with no user or token", () => {
    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it("login() sets user, token and isAuthenticated", () => {
    useAuthStore.getState().login("my-token", mockUser)
    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(token).toBe("my-token")
    expect(user).toEqual(mockUser)
    expect(isAuthenticated).toBe(true)
  })

  it("login() persists to localStorage", () => {
    useAuthStore.getState().login("my-token", mockUser)
    expect(localStorage.getItem("token")).toBe("my-token")
    expect(JSON.parse(localStorage.getItem("user")!)).toEqual(mockUser)
  })

  it("logout() clears state and localStorage", () => {
    useAuthStore.getState().login("my-token", mockUser)
    useAuthStore.getState().logout()
    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
    expect(isAuthenticated).toBe(false)
    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
  })

  it("hydrate() restores state from localStorage", () => {
    localStorage.setItem("token", "stored-token")
    localStorage.setItem("user", JSON.stringify(mockUser))
    useAuthStore.getState().hydrate()
    const { user, token, isAuthenticated } = useAuthStore.getState()
    expect(token).toBe("stored-token")
    expect(user).toEqual(mockUser)
    expect(isAuthenticated).toBe(true)
  })

  it("hydrate() clears corrupted localStorage data", () => {
    localStorage.setItem("token", "some-token")
    localStorage.setItem("user", "not-valid-json{{{")
    useAuthStore.getState().hydrate()
    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("user")).toBeNull()
  })
})
