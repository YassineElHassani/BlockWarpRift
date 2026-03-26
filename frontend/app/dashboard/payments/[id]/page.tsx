"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import gsap from "gsap"
import { motion } from "framer-motion"
import { paymentApi, transactionApi } from "@/services/api"
import { usePaymentSocket } from "@/hooks/useSocket"
import type { PaymentRequest, PaymentStatus, Transaction, TransactionStatus } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Copy, Check, Download, ExternalLink } from "lucide-react"

const statusStyles: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  EXPIRED: "bg-gray-100 text-gray-500 border-gray-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
}

const txStatusStyles: Record<TransactionStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-600",
}

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handleCopy} className="shrink-0 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer flex items-center gap-1">
      {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> {label}</>}
    </button>
  )
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async (silent = false) => {
    try {
      const [pmtRes, txRes] = await Promise.allSettled([
        paymentApi.findOne(id),
        transactionApi.findByPayment(id),
      ])
      if (pmtRes.status === "fulfilled") setPayment(pmtRes.value.data)
      if (txRes.status === "fulfilled") {
        const d = txRes.value.data
        setTransactions(Array.isArray(d) ? d : d?.data ?? [])
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  usePaymentSocket(id, {
    onUpdated: () => { fetchData(true) },
    onConfirmed: () => { fetchData(true) },
  })

  useEffect(() => {
    if (loading || !payment) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.5, ease: "power2.out" })
      gsap.from(bodyRef.current?.children ?? [], { y: 24, opacity: 0, duration: 0.45, stagger: 0.1, delay: 0.15, ease: "power3.out" })
    })
    return () => ctx.revert()
  }, [loading, payment])

  const downloadQR = () => {
    if (!payment?.qrCode) return
    const a = document.createElement("a")
    a.href = payment.qrCode
    a.download = `qr-${payment._id}.png`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground font-medium">Payment not found</p>
        <Link href="/dashboard" className="text-sm text-[var(--primary)] mt-2 hover:underline">← Back to dashboard</Link>
      </div>
    )
  }

  const paymentLink = typeof window !== "undefined" ? `${window.location.origin}/payment/${payment._id}` : `/payment/${payment._id}`

  return (
    <>
      {/* Header */}
      <div ref={headerRef} className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/payments" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Details</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">{payment._id}</p>
        </div>
        <Badge className={`ml-auto text-sm px-3 py-1.5 ${statusStyles[payment.status]}`}>{payment.status}</Badge>
      </div>

      <div ref={bodyRef} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">
          {/* Summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Summary</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">Amount</dt>
                    <dd className="font-bold text-2xl leading-none">{payment.amount} <span className="text-base font-semibold text-[var(--primary)]">{payment.currency}</span></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Status</dt>
                    <dd><Badge className={statusStyles[payment.status]}>{payment.status}</Badge></dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Created</dt>
                    <dd className="font-medium">{new Date(payment.createdAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Expires</dt>
                    <dd className="font-medium">{new Date(payment.expiresAt).toLocaleString()}</dd>
                  </div>
                  {payment.description && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground mb-1">Description</dt>
                      <dd className="font-medium">{payment.description}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wallet address */}
          <Card>
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Wallet Address</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <span className="font-mono text-sm flex-1 break-all">{payment.walletAddress}</span>
                <CopyBtn text={payment.walletAddress} />
              </div>
            </CardContent>
          </Card>

          {/* Payment link */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Payment Link</CardTitle>
              <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-1">
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <span className="font-mono text-sm flex-1 break-all">{paymentLink}</span>
                <CopyBtn text={paymentLink} />
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                On-chain Transactions
                {transactions.length > 0 && <Badge className="bg-[var(--primary-light)] text-[var(--primary)]">{transactions.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Transactions appear once the customer sends payment</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-muted-foreground truncate">{tx.txHash}</span>
                          <CopyBtn text={tx.txHash} label="Copy" />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          From <span className="font-mono">{tx.fromAddress?.slice(0, 10)}…</span>
                          {tx.blockNumber && <> · Block #{tx.blockNumber}</>}
                          {tx.confirmations > 0 && <> · {tx.confirmations} confirms</>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">{tx.amount} {tx.currency}</div>
                        <Badge className={txStatusStyles[tx.status]}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: QR */}
        <div className="lg:col-span-2">
          <Card className="sticky top-8">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">QR Code</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-5">
              {payment.qrCode ? (
                <>
                  <div className="rounded-2xl overflow-hidden border-2 border-border p-3 bg-white shadow-sm">
                    <Image src={payment.qrCode} alt="Payment QR code" width={192} height={192} className="block rounded-lg" unoptimized />
                  </div>
                  <Button variant="outline" className="w-full" onClick={downloadQR}>
                    <Download className="h-4 w-4 mr-2" /> Download QR
                  </Button>
                </>
              ) : (
                <div className="w-48 h-48 rounded-2xl bg-muted flex items-center justify-center text-xs text-muted-foreground border border-border">No QR available</div>
              )}
              <p className="text-xs text-center text-muted-foreground leading-relaxed">Share this QR with your customer to receive payment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}