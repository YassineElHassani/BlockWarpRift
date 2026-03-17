import axios from "axios"
import { env } from "@/config/env"

export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; businessName: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
}

export const paymentApi = {
  create: (data: { amount: number; currency: string; description?: string }) =>
    api.post("/payments", data),
  findAll: () => api.get("/payments"),
  findOne: (id: string) => api.get(`/payments/${id}`),
}

export const transactionApi = {
  findAll: (page = 1, limit = 20) =>
    api.get(`/transactions?page=${page}&limit=${limit}`),
  findByPayment: (paymentId: string) =>
    api.get(`/transactions/payment/${paymentId}`),
}

export const analyticsApi = {
  revenue: () => api.get("/analytics/revenue"),
  transactions: () => api.get("/analytics/transactions"),
  payments: () => api.get("/analytics/payments"),
}