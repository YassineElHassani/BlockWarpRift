// Auth
export interface User {
  id: string
  email: string
  role: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

// Payment
export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "FAILED"
export type Currency = "ETH" | "USDT" | "USDC"

export interface PaymentRequest {
  _id: string
  MerchantId: string
  Amount: number
  Currency: Currency
  WalletAddress: string
  QrCodeUrl: string
  Description?: string
  Status: PaymentStatus
  ExpiresAt: string
  createdAt: string
  updatedAt: string
}

// Transaction
export type TransactionStatus = "PENDING" | "CONFIRMED"

export interface Transaction {
  _id: string
  PaymentRequestId: string
  TxHash: string
  MerchantId: string
  FromAddress: string
  ToAddress: string
  Amount: number
  Currency: Currency
  Confirmations: number
  BlockNumber?: number
  Status: TransactionStatus
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
  total: number
  byDay: { date: string; total: number }[]
  perCurrency: { currency: string; total: number }[]
}

export interface TransactionStatsData {
  counts: Record<string, number>
  recent: Transaction[]
}
