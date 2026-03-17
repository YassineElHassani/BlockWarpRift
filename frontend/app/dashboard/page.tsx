"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import Link from "next/link"
import { paymentApi } from "@/services/api"
import { useMultiPaymentSocket } from "@/hooks/useSocket"
import type { PaymentRequest, PaymentStatus } from "@/types"
import CreatePaymentModal from "@/components/payment/CreatePaymentModal"

const statusColors: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400" },
  PAID:    { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
  EXPIRED: { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400" },
  FAILED:  { bg: "bg-red-50",    text: "text-red-600",    dot: "bg-red-400" },
}

export default function DashboardPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const fetchPayments = useCallback(async () => {
    try {
      const res = await paymentApi.findAll()
      setPayments(res.data?.data ?? res.data ?? [])
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Real-time payment status updates via WebSocket
  const paymentIds = payments.map(p => p._id)
  useMultiPaymentSocket(paymentIds, (payload) => {
    if (payload.status) {
      setPayments(prev =>
        prev.map(p =>
          p._id === payload.paymentId
            ? { ...p, status: payload.status as PaymentStatus }
            : p
        )
      )
    }
  })

  useEffect(() => {
    if (loading) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      })
      gsap.from(tableRef.current, {
        y: 24,
        opacity: 0,
        duration: 0.6,
        delay: 0.15,
        ease: "power3.out",
      })
    })
    return () => ctx.revert()
  }, [loading])

  const totals = {
    all: payments.length,
    paid: payments.filter((p) => p.status === "PAID").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
  }

  return (
    <>
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Manage your payment requests
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-dark)] transition-all duration-200 shadow-sm shadow-purple-200 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New payment
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: totals.all, color: "text-gray-900" },
          { label: "Paid", value: totals.paid, color: "text-green-600" },
          { label: "Pending", value: totals.pending, color: "text-yellow-600" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm"
          >
            <p className="text-sm text-[var(--text-secondary)] font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-[var(--primary)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L20 6.5V15.5L11 20L2 15.5V6.5L11 2Z" stroke="var(--primary)" strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">No payments yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Create your first payment request to get started
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">ID</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {payments.map((p) => {
                const s = statusColors[p.status]
                return (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{p._id.slice(-8)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {p.amount} <span className="text-[var(--text-secondary)] font-normal">{p.currency}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">
                      {p.description || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/payments/${p._id}`} className="text-xs font-medium text-[var(--primary)] hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <CreatePaymentModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            fetchPayments()
          }}
        />
      )}
    </>
  )
}
