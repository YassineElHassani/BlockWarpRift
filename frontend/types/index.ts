// Auth
export interface User {
  _id: string
  email: string
  businessName: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  hydrate: () => void
}

// Payment
export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED"
export type Currency = "ETH" | "USDT" | "USDC"

export interface PaymentRequest {
  _id: string
  merchantId: string
  amount: number
  currency: Currency
  walletAddress: string
  qrCode?: string
  description?: string
  status: PaymentStatus
  expiresAt: string
  createdAt: string
  updatedAt: string
}

// Transaction
export type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED"

export interface Transaction {
  _id: string
  paymentId: string
  txHash: string
  fromAddress: string
  toAddress: string
  amount: number
  currency: Currency
  confirmations: number
  blockNumber?: number
  status: TransactionStatus
  createdAt: string
}

export interface PaginatedTransactions {
  data: Transaction[]
  total: number
  page: number
  limit: number
}

// Analytics
export interface RevenueData {
  totalRevenue: number
  revenueByDay: { date: string; revenue: number }[]
  revenuePerCurrency: { currency: string; revenue: number }[]
}

export interface TransactionStatsData {
  total: number
  confirmed: number
  pending: number
  failed: number
  recentTransactions: Transaction[]
}

export interface PaymentStatsData {
  total: number
  paid: number
  pending: number
  expired: number
  failed: number
}
