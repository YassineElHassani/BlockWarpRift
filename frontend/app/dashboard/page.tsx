/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import gsap from "gsap"
import { analyticsApi, paymentApi } from "@/services/api"
import { useMultiPaymentSocket } from "@/hooks/useSocket"
import RevenueChart from "@/components/dashboard/RevenueChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  CircleCheck,
  Clock,
  CircleX,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [revenue, setRevenue] = useState<any>(null)
  const [txnStats, setTxnStats] = useState<any>(null)
  const [payStats, setPayStats] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, txnRes, payRes, pmtRes] = await Promise.all([
          analyticsApi.revenue(),
          analyticsApi.transactions(),
          analyticsApi.payments(),
          paymentApi.findAll(),
        ])
        setRevenue(revRes.data)
        setTxnStats(txnRes.data)
        setPayStats(payRes.data)
        setPayments(pmtRes.data?.slice?.(0, 5) ?? [])
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const paymentIds = payments.map((p: any) => p._id).filter(Boolean)
  useMultiPaymentSocket(paymentIds, () => {
    analyticsApi.transactions().then((r) => setTxnStats(r.data)).catch(() => {})
    analyticsApi.payments().then((r) => setPayStats(r.data)).catch(() => {})
  })

  useEffect(() => {
    if (isLoading) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -20, opacity: 0, duration: 0.5, ease: "power2.out" })
    })
    return () => ctx.revert()
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    )
  }

  const kpiCards = [
    { title: "Total Revenue", value: `${revenue?.totalRevenue?.toFixed(4) ?? "0.0000"} ETH`, icon: TrendingUp, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10" },
    { title: "Confirmed Txs", value: txnStats?.confirmed ?? 0, icon: CircleCheck, color: "text-[var(--accent-dark)]", bg: "bg-[var(--accent)]/10" },
    { title: "Pending Payments", value: payStats?.pending ?? 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Failed Txs", value: txnStats?.failed ?? 0, icon: CircleX, color: "text-red-500", bg: "bg-red-500/10" },
  ]

  return (
    <>
      <div ref={headerRef} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Track your real-time crypto revenue and metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((kpi, i) => (
          <motion.div key={kpi.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                {revenue?.revenueByDay?.length > 0 ? <RevenueChart data={revenue.revenueByDay} /> : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data available yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Currency</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenue?.revenuePerCurrency?.map((curr: any) => (
                    <div key={curr.currency} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-xs font-bold text-[var(--primary)]">{curr.currency[0]}</div>
                        <span className="font-medium text-sm">{curr.currency}</span>
                      </div>
                      <span className="font-semibold text-sm">{curr.revenue.toFixed(4)}</span>
                    </div>
                  ))}
                  {!revenue?.revenuePerCurrency?.length && <p className="text-sm text-muted-foreground">No data yet.</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <Link href="/dashboard/transactions" className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1">View all <ArrowUpRight className="h-3 w-3" /></Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {txnStats?.recentTransactions?.slice(0, 5).map((tx: any) => (
                    <div key={tx._id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-mono font-medium truncate max-w-[120px]" title={tx.txHash}>{tx.txHash.slice(0, 6)}…{tx.txHash.slice(-4)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{tx.amount} {tx.currency}</p>
                        <Badge variant={tx.status === "CONFIRMED" ? "default" : "secondary"} className={tx.status === "CONFIRMED" ? "bg-green-50 text-green-700 hover:bg-green-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50"}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {!txnStats?.recentTransactions?.length && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  )
}