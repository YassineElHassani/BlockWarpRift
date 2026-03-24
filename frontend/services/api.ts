import axios from "axios"
import { env } from "@/config/env"

export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Typed API methods
export const authApi = {
  register: (data: { email: string; password: string }) =>
    api.post<{ message: string; user: import("@/types").User }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; user: import("@/types").User }>("/auth/login", data),
}

export const paymentApi = {
  create: (data: { amount: number; currency: string; description?: string }) =>
    api.post("/payment", data),
  findAll: () => api.get("/payment"),
  findOne: (id: string) => api.get(`/payment/${id}`),
  findPublic: (id: string) => api.get(`/payment/public/${id}`),
}

export const transactionApi = {
  findAll: (page = 1, limit = 20) =>
    api.get(`/transaction?page=${page}&limit=${limit}`),
  findAll_admin: (page = 1, limit = 10) =>
    api.get(`/transaction/all?page=${page}&limit=${limit}`),
  findByPayment: (paymentId: string) => api.get(`/transaction/${paymentId}`),
}

export const analyticsApi = {
  revenue: () => api.get("/analytics/revenue"),
  transactions: () => api.get("/analytics/transactions"),
  payments: () => api.get("/analytics/payments"),
}

export const usersApi = {
  findAll: () => api.get("/users"),
  remove: (id: string) => api.delete(`/users/${id}`),
}