"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import gsap from "gsap"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 14L6 10L9 12L13 7L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 6h12M3 9h8M3 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, {
        x: -280,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      })
      gsap.from(itemsRef.current?.children ?? [], {
        x: -20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.07,
        delay: 0.3,
        ease: "power2.out",
      })
    })
    return () => ctx.revert()
  }, [])

  return (
    <aside
      ref={sidebarRef}
      className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-56 bg-white border-r border-[var(--border)] flex flex-col py-6 z-40"
    >
      <div className="px-4 mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Navigation
        </span>
      </div>

      <div ref={itemsRef} className="flex flex-col gap-1 px-3 flex-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-[var(--primary-light)] text-[var(--primary)] shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-[var(--primary)]" : "text-gray-400 group-hover:text-gray-600"
                }`}
              >
                {icon}
              </span>
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          )
        })}
      </div>

      <div className="px-4 pt-4 border-t border-[var(--border)] mx-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="5" r="2.5" stroke="var(--primary)" strokeWidth="1.2"/>
              <path d="M2 12c0-2.5 2.25-4 5-4s5 1.5 5 4" stroke="var(--primary)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-700">Merchant</p>
            <p className="text-xs text-gray-400">Sepolia Testnet</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
