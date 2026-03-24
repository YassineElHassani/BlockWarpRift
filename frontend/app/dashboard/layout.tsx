"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth.store"
import Navbar from "@/components/ui/Navbar"
import Sidebar from "@/components/ui/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, hydrate } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    hydrate()
    setHydrated(true)
  }, [hydrate])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-[var(--muted)]">
      <Navbar />
      <Sidebar />
      <main className="pl-56 pt-16 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
