"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import gsap from "gsap"
import { useAuthStore } from "@/store/auth.store"

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/analytics", label: "Analytics" },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const { logout } = useAuthStore()

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(navRef.current, {
        y: -60,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      })
      gsap.from(logoRef.current, {
        x: -20,
        opacity: 0,
        duration: 0.5,
        delay: 0.2,
        ease: "power2.out",
      })
      gsap.from(linksRef.current?.children ?? [], {
        y: -10,
        opacity: 0,
        duration: 0.4,
        stagger: 0.06,
        delay: 0.3,
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
      className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center px-6 z-50"
    >
      <div ref={logoRef} className="flex items-center gap-2.5 mr-10">
        <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="white"/>
          </svg>
        </div>
        <span className="font-bold text-[15px] text-gray-900 tracking-tight">
          BlockWarpRift
        </span>
      </div>

      <div ref={linksRef} className="flex items-center gap-1 flex-1">
        {links.map(({ href, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary-light)] text-[var(--primary)]"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <button
        onClick={handleLogout}
        className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
      >
        Sign out
      </button>
    </nav>
  )
}
