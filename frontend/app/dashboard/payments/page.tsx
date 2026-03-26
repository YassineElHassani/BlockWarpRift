/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { paymentApi } from "@/services/api"
import { useMultiPaymentSocket } from "@/hooks/useSocket"
import { useMetaMask } from "@/hooks/useMetaMask"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import gsap from "gsap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  XCircle,
  Wallet,
  Plus,
  ExternalLink,
  RefreshCw,
  LogOut,
} from "lucide-react"

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 5
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const { account, isConnecting, error: walletError, connect, disconnect, reconnect } = useMetaMask()
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await paymentApi.findAll()
      setPayments(data)
    } catch (err) {
      console.error("Failed to load payments", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const paymentIds = payments.map((p: any) => p._id).filter(Boolean)
  useMultiPaymentSocket(paymentIds, () => { fetchPayments() })

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.45, ease: "power2.out" })
      if (listRef.current?.children) {
        gsap.from(listRef.current.children, { y: 16, opacity: 0, duration: 0.35, stagger: 0.06, delay: 0.2, ease: "power2.out" })
      }
    })
    return () => ctx.revert()
  }, [isLoading])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const { data } = await paymentApi.create({ amount: Number(amount), currency: "ETH", description })
      setPayments([data, ...payments])
      setPage(1)
      setAmount("")
      setDescription("")
      showToast("Payment request created!", "success")
    } catch {
      showToast("Failed to create payment.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-50 text-green-700",
      PENDING: "bg-amber-50 text-amber-700",
      EXPIRED: "bg-gray-100 text-gray-500",
      FAILED: "bg-red-50 text-red-600",
    }
    return <Badge className={styles[status] ?? "bg-gray-100 text-gray-500"}>{status}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div ref={headerRef} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Create and manage payment requests.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Create Form */}
        <motion.div className="lg:w-1/3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Request Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {!account ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Connect your MetaMask or any other wallet to receive payments directly.</p>
                  {walletError && <p className="text-sm text-destructive">{walletError}</p>}
                  <Button onClick={connect} disabled={isConnecting} className="w-full bg-foreground hover:bg-foreground/90">
                    <Wallet className="h-4 w-4 mr-2" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-4 px-3 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Connected Wallet</p>
                    <p className="text-sm font-mono text-[var(--accent-dark)] truncate mb-2">{account}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={reconnect}
                        disabled={isConnecting}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {isConnecting ? "Switching..." : "Switch"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={disconnect}
                      >
                        <LogOut className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <input type="number" step="0.000001" min="0.000001" required value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] outline-none transition-all text-sm" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Currency</label>
                      <div className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl font-medium text-sm">ETH</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description (Optional)</label>
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] outline-none transition-all text-sm" placeholder="Order #1234" />
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)]">
                      {isSubmitting ? "Creating..." : "Generate Request"}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payments List */}
        <div className="lg:w-2/3">
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle>Payment Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div ref={listRef} className="divide-y divide-border">
                {payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(p => (
                  <div key={p._id} className="p-5 hover:bg-muted/30 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors">
                    <div>
                      <p className="font-semibold text-lg">{p.amount} {p.currency}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{p.description || "No description"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(p.status)}
                      <Link href={`/dashboard/payments/${p._id}`}>
                        <Button variant="outline" size="sm" className="text-xs">
                          Details <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">No payment requests found. Create one.</div>
                )}
              </div>
              {payments.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, payments.length)} of {payments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1} className="text-xs">Previous</Button>
                    <span className="text-xs font-medium text-muted-foreground">{page} / {Math.ceil(payments.length / PAGE_SIZE)}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(payments.length / PAGE_SIZE)} className="text-xs">Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl font-medium text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {toast.type === "success" ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
