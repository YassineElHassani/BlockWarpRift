"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { authApi } from "@/services/api"
import { useAuthStore } from "@/store/auth.store"

export default function RegisterPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuthStore()

  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const fieldsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
      return
    }
    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 32,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      })
      gsap.from(fieldsRef.current?.children ?? [], {
        y: 16,
        opacity: 0,
        duration: 0.4,
        stagger: 0.07,
        delay: 0.2,
        ease: "power2.out",
      })
    })
    return () => ctx.revert()
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({ email, password, businessName })
      const { access_token, user } = res.data
      login(access_token, user)
      router.replace("/dashboard")
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message ?? err.message
          : "Registration failed. Please try again."
      setError(typeof msg === "string" ? msg : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={cardRef}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Start accepting crypto payments today
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div ref={fieldsRef} className="flex flex-col gap-4">
          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Business name */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Business name
            </label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Acme Store"
              required
              autoComplete="organization"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
            />
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-all duration-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-purple-200 cursor-pointer mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </div>
      </form>

      <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
