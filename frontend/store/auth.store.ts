import { create } from "zustand"
import type { User, AuthState } from "@/types"

export const useAuthStore = create<AuthState>((set) => {
  let token: string | null = null
  let user: User | null = null
  let isAuthenticated = false

  if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("token")
    const raw = localStorage.getItem("user")

    if (storedToken && raw) {
      try {
        const parsedUser: User = JSON.parse(raw)
        token = storedToken
        user = parsedUser
        isAuthenticated = true
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,

    login: (loginToken: string, loginUser: User) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", loginToken)
        localStorage.setItem("user", JSON.stringify(loginUser))
      }
      set({ token: loginToken, user: loginUser, isAuthenticated: true })
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
      const storedToken = localStorage.getItem("token")
      const raw = localStorage.getItem("user")
      if (storedToken && raw) {
        try {
          const parsedUser: User = JSON.parse(raw)
          set({ token: storedToken, user: parsedUser, isAuthenticated: true })
        } catch {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      }
    },
  }
})
