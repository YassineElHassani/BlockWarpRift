import { create } from "zustand"
import type { User, AuthState } from "@/types"

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
    }
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
    set({ token: null, user: null, isAuthenticated: false })
  },

  hydrate: () => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    const raw = localStorage.getItem("user")
    if (token && raw) {
      try {
        const user: User = JSON.parse(raw)
        set({ token, user, isAuthenticated: true })
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
  },
}))
