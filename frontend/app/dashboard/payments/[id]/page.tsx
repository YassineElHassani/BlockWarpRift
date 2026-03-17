"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import gsap from "gsap"
import { paymentApi } from "@/services/api"
import type { PaymentRequest, PaymentStatus } from "@/types"
import Image from "next/image"

const statusColors: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  PAID:    { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
  EXPIRED: { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400" },
  FAILED:  { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400" },
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<"address" | "link" | null>(null)

  const headerRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    paymentApi
      .findOne(id)
      .then((res) => setPayment(res.data))
      .catch(() => setPayment(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (loading || !payment) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.5, ease: "power2.out" })
      gsap.from(bodyRef.current?.children ?? [], {
        y: 20,
        opacity: 0,
        duration: 0.45,
        stagger: 0.1,
        delay: 0.15,
        ease: "power2.out",
      })
    })
    return () => ctx.revert()
  }, [loading, payment])

  const copy = async (text: string, type: "address" | "link") => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-gray-600 font-medium">Payment not found</p>
        <Link href="/dashboard" className="text-sm text-[var(--primary)] mt-2 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    )
  }

  const s = statusColors[payment.status]
  const paymentLink = `${typeof window !== "undefined" ? window.location.origin : ""}/payment/${payment._id}`

  return (
    <>
      {/* Header */}
      <div ref={headerRef} className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[var(--border)] hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment details</h1>
          <p className="text-sm text-[var(--text-secondary)] font-mono mt-0.5">{payment._id}</p>
        </div>
        <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${s.bg} ${s.text}`}>
          <span className={`w-2 h-2 rounded-full ${s.dot}`} />
          {payment.status}
        </span>
      </div>

      <div ref={bodyRef} className="grid grid-cols-5 gap-6">
        {/* Left: details */}
        <div className="col-span-3 flex flex-col gap-5">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Summary</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)] mb-0.5">Amount</dt>
                <dd className="font-bold text-xl text-gray-900">{payment.amount} <span className="text-base font-semibold text-[var(--primary)]">{payment.currency}</span></dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)] mb-0.5">Created</dt>
                <dd className="font-medium text-gray-900">{new Date(payment.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)] mb-0.5">Expires</dt>
                <dd className="font-medium text-gray-900">{new Date(payment.expiresAt).toLocaleString()}</dd>
              </div>
              {payment.description && (
                <div className="col-span-2">
                  <dt className="text-[var(--text-secondary)] mb-0.5">Description</dt>
                  <dd className="font-medium text-gray-900">{payment.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Wallet address card */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Wallet address</h2>
            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-4 py-3">
              <span className="font-mono text-sm text-gray-700 flex-1 break-all">{payment.walletAddress}</span>
              <button
                onClick={() => copy(payment.walletAddress, "address")}
                className="shrink-0 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer"
              >
                {copied === "address" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Payment link card */}
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Payment link</h2>
            <div className="flex items-center gap-3 bg-[var(--muted)] rounded-xl px-4 py-3">
              <span className="font-mono text-sm text-gray-700 flex-1 break-all">{paymentLink}</span>
              <button
                onClick={() => copy(paymentLink, "link")}
                className="shrink-0 text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors cursor-pointer"
              >
                {copied === "link" ? "Copied!" : "Copy"}
              </button>
            </div>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Open page →
            </a>
          </div>
        </div>

        {/* Right: QR code */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 flex flex-col items-center gap-4 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide self-start">QR Code</h2>
            {payment.qrCode ? (
              <div className="rounded-xl overflow-hidden border border-[var(--border)] p-2 bg-white">
                <Image
                  src={payment.qrCode}
                  alt="Payment QR code"
                  width={200}
                  height={200}
                  className="block"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-[200px] h-[200px] rounded-xl bg-[var(--muted)] flex items-center justify-center text-xs text-gray-400">
                No QR available
              </div>
            )}
            <p className="text-xs text-center text-[var(--text-secondary)]">
              Share this code with your customer to receive payment
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
