"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import gsap from "gsap"
import DashboardSidebar from "@/components/layout/DashboardSidebar"
import RoleGuard from "@/components/layout/RoleGuard"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mainRef.current) return
    gsap.fromTo(
      mainRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", clearProps: "all" }
    )
  }, [pathname])

  return (
    <RoleGuard allowedRoles={["MERCHANT", "ADMIN"]}>
      <div className="flex min-h-screen bg-muted/30">
        <DashboardSidebar />
        <main
          ref={mainRef}
          className="flex-1 min-h-screen overflow-x-hidden"
        >
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}
