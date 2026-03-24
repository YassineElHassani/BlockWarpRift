"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { useAuthStore } from "@/store/auth.store"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()
  const navRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -60,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      })
      gsap.from(logoRef.current, {
        x: -20,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power2.out",
      })
    })
    return () => ctx.revert()
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <nav
      ref={navRef}
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center px-6"
      style={{ boxShadow: "0 1px 0 0 #e4e4f0" }}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Logo */}
        <div ref={logoRef}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6V10M6 8H10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-tight">
              BlockWarpRift
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard/analytics", label: "Analytics" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === href
                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    </nav>
  )
}
