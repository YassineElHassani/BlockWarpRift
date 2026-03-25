"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import gsap from "gsap"
import { paymentApi, transactionApi } from "@/services/api"
import type { PaymentRequest, PaymentStatus, Transaction, TransactionStatus } from "@/types"
import Image from "next/image"
import { usePaymentSocket } from "@/hooks/useSocket"

const statusColors: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  PAID: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  EXPIRED: { bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
}

const txStatusColors: Record<TransactionStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  CONFIRMED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" },
  FAILED: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400" },
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer"
    >
      {copied ? "Copied!" : label}
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

  // Real-time updates via WebSocket
  usePaymentSocket(id, {
    onUpdated: () => { fetchData(true) },
    onConfirmed: () => { fetchData(true) },
  })

  useEffect(() => {
    if (loading || !payment) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.5, ease: "power2.out" })
      gsap.from(bodyRef.current?.children ?? [], {
        y: 24,
        opacity: 0,
        duration: 0.45,
        stagger: 0.1,
        delay: 0.15,
        ease: "power3.out",
      })
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
        <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-600 font-medium">Payment not found</p>
        <Link href="/dashboard" className="text-sm text-[var(--primary)] mt-2 hover:underline">← Back to dashboard</Link>
      </div>
    )
  }

  const s = statusColors[payment.status]
  const paymentLink = typeof window !== "undefined"
    ? `${window.location.origin}/payment/${payment._id}`
    : `/payment/${payment._id}`

  return (
    <>
      {/* Header */}
      <div ref={headerRef} className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment details</h1>
          <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 select-all">{payment._id}</p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${s.bg} ${s.text}`}>
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          {payment.status}
        </span>
      </div>

      <div ref={bodyRef} className="grid grid-cols-5 gap-6">
        {/* ── Left column ── */}
        <div className="col-span-3 flex flex-col gap-5">

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Summary</h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)] mb-1">Amount</dt>
                <dd className="font-bold text-2xl text-gray-900 leading-none">
                  {payment.amount}
                  <span className="text-base font-semibold text-[var(--primary)] ml-1">{payment.currency}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)] mb-1">Status</dt>
                <dd>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {payment.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)] mb-1">Created</dt>
                <dd className="font-medium text-gray-800">{new Date(payment.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)] mb-1">Expires</dt>
                <dd className="font-medium text-gray-800">{new Date(payment.expiresAt).toLocaleString()}</dd>
              </div>
              {payment.description && (
                <div className="col-span-2">
                  <dt className="text-[var(--text-secondary)] mb-1">Description</dt>
                  <dd className="font-medium text-gray-800">{payment.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Wallet address */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Wallet address</h2>
            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-4 py-3">
              <span className="font-mono text-sm text-gray-700 flex-1 break-all">{payment.walletAddress}</span>
              <CopyButton text={payment.walletAddress} />
            </div>
          </div>

          {/* Payment link */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Payment link</h2>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-1"
              >
                Open page
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 9L9 2M9 2H4M9 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-4 py-3">
              <span className="font-mono text-sm text-gray-700 flex-1 break-all">{paymentLink}</span>
              <CopyButton text={paymentLink} />
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                On-chain transactions
                {transactions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[10px] font-bold normal-case">
                    {transactions.length}
                  </span>
                )}
              </h2>
            </div>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-[var(--text-secondary)]">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Transactions will appear once the customer sends payment</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {transactions.map((tx) => {
                  const ts = txStatusColors[tx.status]
                  return (
                    <div key={tx._id} className="px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500 truncate">{tx.txHash}</span>
                          <CopyButton text={tx.txHash} label="Copy hash" />
                        </div>
                        <div className="text-xs text-gray-400">
                          From <span className="font-mono">{tx.fromAddress?.slice(0, 10)}…</span>
                          {tx.blockNumber && <> · Block #{tx.blockNumber}</>}
                          {tx.confirmations > 0 && <> · {tx.confirmations} confirmations</>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm text-gray-900">{tx.amount} {tx.currency}</div>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ts.bg} ${ts.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ts.dot}`} />
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: QR ── */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-col items-center gap-5 sticky top-24">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest self-start">QR Code</h2>
            {payment.qrCode ? (
              <>
                <div className="rounded-2xl overflow-hidden border-2 border-[var(--border)] p-3 bg-white shadow-sm">
                  <Image
                    src={payment.qrCode}
                    alt="Payment QR code"
                    width={192}
                    height={192}
                    className="block rounded-lg"
                    unoptimized
                  />
                </div>
                <button
                  onClick={downloadQR}
                  className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Download QR
                </button>
              </>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-[var(--muted)] flex items-center justify-center text-xs text-gray-400 border border-[var(--border)]">
                No QR available
              </div>
            )}
            <p className="text-xs text-center text-[var(--text-secondary)] leading-relaxed">
              Share this QR with your customer.<br />They can scan it to pay directly.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

