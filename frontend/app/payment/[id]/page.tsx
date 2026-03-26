"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import gsap from "gsap"
import { paymentApi } from "@/services/api"
import { usePaymentSocket } from "@/hooks/useSocket"
import type { PaymentRequest, PaymentStatus } from "@/types"
import Image from "next/image"

const statusConfig: Record<PaymentStatus, {
  label: string
  description: string
  bg: string
  text: string
  icon: React.ReactNode
}> = {
  PENDING: {
    label: "Awaiting payment",
    description: "Send the exact amount to the wallet address below.",
    bg: "bg-yellow-50 border-yellow-100",
    text: "text-yellow-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  PAID: {
    label: "Payment confirmed",
    description: "This payment has been received and confirmed on-chain.",
    bg: "bg-green-50 border-green-100",
    text: "text-green-700",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6.5 10l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  EXPIRED: {
    label: "Link expired",
    description: "This payment link has expired. Please request a new one.",
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-600",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  FAILED: {
    label: "Payment failed",
    description: "Something went wrong with this payment.",
    bg: "bg-red-50 border-red-100",
    text: "text-red-600",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
}

function CopyButton({ text, children }: { text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="relative group flex items-center gap-2 cursor-pointer"
    >
      {children}
      <span className={`text-xs font-medium transition-colors ${copied ? "text-green-500" : "text-[var(--primary)] group-hover:text-[var(--primary-dark)]"}`}>
        {copied ? "Copied!" : "Copy"}
      </span>
    </button>
  )
}

export default function PublicPaymentPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [prevStatus, setPrevStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)

  const pageRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)

  const fetchPayment = useCallback(async (silent = false) => {
    try {
      const res = await paymentApi.findPublic(id)
      setPayment(prev => {
        setPrevStatus(prev?.status ?? null)
        return res.data
      })
    } catch {
      if (!silent) setNotFound(true)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchPayment() }, [fetchPayment])

  // Poll every 5s while PENDING — stop when PAID / EXPIRED / FAILED
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return
    const interval = setInterval(() => fetchPayment(true), 5000)
    return () => clearInterval(interval)
  }, [payment, fetchPayment])

  // Real-time WebSocket — instant status updates without relying solely on polling
  usePaymentSocket(payment ? id : undefined, {
    onUpdated: (payload) => {
      if (payload.status) {
        setPayment(prev =>
          prev ? { ...prev, status: payload.status as PaymentStatus } : prev
        )
        setPrevStatus(payment?.status ?? null)
      }
    },
    onConfirmed: () => {
      setPayment(prev => prev ? { ...prev, status: "PAID" } : prev)
      setPrevStatus("PENDING")
    },
  })

  // Animate card on status transition to PAID
  useEffect(() => {
    if (payment?.status === "PAID" && prevStatus === "PENDING" && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.97 },
        { scale: 1, duration: 0.5, ease: "back.out(1.6)" }
      )
    }
  }, [payment?.status, prevStatus])

  // Countdown timer for PENDING payments
  useEffect(() => {
    if (!payment || payment.status !== "PENDING") return
    const update = () => {
      const diff = new Date(payment.expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft("Expired"); return }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [payment])

  useEffect(() => {
    if (loading) return
    const ctx = gsap.context(() => {
      gsap.from(pageRef.current, { opacity: 0, duration: 0.4, ease: "power1.out" })
      gsap.from(cardRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.7,
        delay: 0.1,
        ease: "power3.out",
      })
      if (actionsRef.current) {
        gsap.from(actionsRef.current.children, {
          y: 16,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.4,
          ease: "power2.out",
        })
      }
    })
    return () => ctx.revert()
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
        <svg className="animate-spin h-7 w-7 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  if (notFound || !payment) {
    return (
      <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M8 8l6 6M14 8l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900">Payment not found</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            This payment link is invalid or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const cfg = statusConfig[payment.status]

  return (
    <div ref={pageRef} className="min-h-screen bg-[var(--muted)] flex flex-col items-center justify-center p-4 py-12">

      <div ref={cardRef} className="bg-white rounded-3xl border border-[var(--border)] shadow-lg w-full max-w-md overflow-hidden">
        {/* Status banner */}
        <div className={`flex items-center gap-3 px-6 py-4 border-b ${cfg.bg} ${cfg.text}`}>
          {cfg.icon}
          <div>
            <p className="font-semibold text-sm">{cfg.label}</p>
            <p className="text-xs opacity-80 mt-0.5">{cfg.description}</p>
          </div>
          {payment.status === "PENDING" && timeLeft && (
            <span className="ml-auto font-mono text-sm font-bold shrink-0 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              {timeLeft}
            </span>
          )}
        </div>

        {/* Amount */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-[var(--border)]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Amount due</p>
          <p className="text-5xl font-black text-gray-900 tracking-tight">
            {payment.amount}
          </p>
          <p className="text-xl font-bold text-[var(--primary)] mt-1">{payment.currency}</p>
          {payment.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-3 bg-[var(--muted)] rounded-xl px-4 py-2 inline-block">
              {payment.description}
            </p>
          )}
        </div>

        <div ref={actionsRef} className="p-6 flex flex-col gap-4">
          {/* QR Code */}
          {payment.qrCode && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl overflow-hidden border-2 border-[var(--border)] p-3 bg-white shadow-sm">
                <Image
                  src={payment.qrCode}
                  alt="Scan to pay"
                  width={180}
                  height={180}
                  className="block rounded-lg"
                  unoptimized
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Scan with your wallet app</p>
            </div>
          )}

          {/* Wallet address */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Send to address</p>
            <CopyButton text={payment.walletAddress}>
              <div className="flex-1 bg-[var(--muted)] rounded-xl px-4 py-3 font-mono text-sm text-gray-700 break-all text-left">
                {payment.walletAddress}
              </div>
            </CopyButton>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between pt-2 text-xs text-[var(--text-secondary)]">
            <span>Network</span>
            <span className="font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              Ethereum Sepolia
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Expires</span>
            <span className="font-semibold text-gray-700">{new Date(payment.expiresAt).toLocaleString()}</span>
          </div>

          {/* Warning for pending */}
          {payment.status === "PENDING" && (
            <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-700 mt-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                <path d="M7 2L13 12H1L7 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M7 6v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
              </svg>
              <span>Send exactly <strong>{payment.amount} {payment.currency}</strong>. Sending a different amount may cause the payment to fail.</span>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center">
        Powered by <span className="font-semibold text-gray-500">BlockWarpRift</span>
      </p>
    </div>
  )
}

