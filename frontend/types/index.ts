export interface User {
  _id: string
  email: string
  businessName: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hydrate: () => void
}

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED"
export type Currency = "ETH" | "USDT" | "USDC"

export interface PaymentRequest {
  _id: string
  merchantId: string
  amount: number
  currency: Currency
  description?: string
  status: PaymentStatus
  walletAddress: string
  qrCode?: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED"

export interface Transaction {
  _id: string
  paymentId: string
  txHash: string
  from: string
  to: string
  amount: string
  currency: Currency
  status: TransactionStatus
  blockNumber?: number
  createdAt: string
}

export interface PaginatedTransactions {
  data: Transaction[]
  total: number
  page: number
  limit: number
}

export interface RevenueData {
  daily: { date: string; amount: number }[]
  totalRevenue: number
  currency: string
}

export interface TransactionStatsData {
  total: number
  confirmed: number
  pending: number
  failed: number
}
