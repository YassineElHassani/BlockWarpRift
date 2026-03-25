"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { paymentApi } from "@/services/api"

type Currency = "ETH"

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreatePaymentModal({ onClose, onCreated }: Props) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("ETH")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(overlayRef.current, { opacity: 0, duration: 0.25, ease: "power1.out" })
      gsap.from(cardRef.current, {
        y: 32,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      })
    })
    return () => ctx.revert()
  }, [])

  const handleClose = () => {
    gsap.to(cardRef.current, { y: 16, opacity: 0, duration: 0.25, ease: "power2.in" })
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.25,
      onComplete: onClose,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than 0.")
      return
    }
    setLoading(true)
    try {
      await paymentApi.create({ amount: parsed, currency, description: description || undefined })
      onCreated()
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            err.message
          : "Failed to create payment."
      setError(typeof msg === "string" ? msg : "Failed to create payment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === overlayRef.current && handleClose()}
    >
      <div
        ref={cardRef}
        className="bg-white rounded-2xl border border-[var(--border)] shadow-xl w-full max-w-md p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">New payment</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">Create a crypto payment request</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Amount + currency row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200 cursor-pointer"
              >
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Order #1234, subscription, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-purple-200 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create payment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
