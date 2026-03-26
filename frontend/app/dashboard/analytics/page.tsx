"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar } from "react-chartjs-2"
import gsap from "gsap"
import { motion } from "framer-motion"
import { analyticsApi } from "@/services/api"
import type { RevenueData, TransactionStatsData, PaymentStatsData } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend)

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted rounded-xl ${className}`} />
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [txStats, setTxStats] = useState<TransactionStatsData | null>(null)
  const [pmtStats, setPmtStats] = useState<PaymentStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.allSettled([
      analyticsApi.revenue(),
      analyticsApi.transactions(),
      analyticsApi.payments(),
    ]).then(([rev, tx, pmt]) => {
      if (rev.status === "fulfilled") setRevenue(rev.value.data)
      if (tx.status === "fulfilled") setTxStats(tx.value.data)
      if (pmt.status === "fulfilled") setPmtStats(pmt.value.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.45, ease: "power2.out" })
      gsap.from(chartRef.current, { y: 24, opacity: 0, duration: 0.5, delay: 0.2, ease: "power3.out" })
      gsap.from(tableRef.current, { y: 24, opacity: 0, duration: 0.5, delay: 0.4, ease: "power3.out" })
    })
    return () => ctx.revert()
  }, [loading])

  const revenueChartData = {
    labels: revenue?.revenueByDay.map(d => {
      const dt = new Date(d.date)
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }) ?? [],
    datasets: [{
      label: "Revenue (ETH)",
      data: revenue?.revenueByDay.map(d => d.revenue) ?? [],
      borderColor: "#2563eb",
      backgroundColor: "rgba(108,71,255,0.08)",
      borderWidth: 2,
      pointRadius: 4,
      pointBackgroundColor: "#2563eb",
      fill: true,
      tension: 0.4,
    }],
  }

  const statusBarData = {
    labels: ["Paid", "Pending", "Expired", "Failed"],
    datasets: [{
      data: [pmtStats?.paid ?? 0, pmtStats?.pending ?? 0, pmtStats?.expired ?? 0, pmtStats?.failed ?? 0],
      backgroundColor: ["#00d4aa", "#f59e0b", "#9ca3af", "#ef4444"],
      borderRadius: 8,
      barThickness: 32,
    }],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#fff", borderColor: "#e4e4f0", borderWidth: 1, titleColor: "#111", bodyColor: "#6b7280", padding: 10 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
      y: { grid: { color: "#f0f0f5" }, ticks: { color: "#9ca3af", font: { size: 11 } } },
    },
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#9ca3af", font: { size: 11 } } },
      y: { grid: { color: "#f0f0f5" }, ticks: { color: "#9ca3af", font: { size: 11 }, stepSize: 1 } },
    },
  }

  const statCards = [
    { label: "Total Revenue", value: revenue?.totalRevenue ? `${revenue.totalRevenue.toFixed(4)} ETH` : "—", accent: "text-[var(--primary)]" },
    { label: "Total Payments", value: pmtStats?.total ?? "—", sub: `${pmtStats?.paid ?? 0} paid · ${pmtStats?.pending ?? 0} pending` },
    { label: "Tx Confirmed", value: txStats?.confirmed ?? "—", sub: `${txStats?.failed ?? 0} failed · ${txStats?.pending ?? 0} pending` },
    { label: "Conversion", value: pmtStats?.total ? `${((pmtStats.paid / pmtStats.total) * 100).toFixed(0)}%` : "—", accent: "text-[var(--accent-dark)]" },
  ]

  return (
    <>
      <div ref={headerRef} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue and transaction performance overview</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, i) => (
            <motion.div key={card.label} className="h-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.35 }}>
              <Card className="h-full">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{card.label}</p>
                  <p className={`text-2xl font-black tracking-tight ${card.accent ?? "text-foreground"}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub ?? "\u00A0"}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Over Time</CardTitle>
            <p className="text-xs text-muted-foreground">Daily confirmed revenue (ETH)</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52" /> : (
              <div style={{ height: 220 }}>
                {revenue && revenue.revenueByDay.length > 0
                  ? <Line data={revenueChartData} options={chartOptions} />
                  : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No revenue data available</div>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution across all statuses</p>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-52" /> : (
              <div style={{ height: 220 }}>
                {pmtStats && pmtStats.total > 0
                  ? <Bar data={statusBarData} options={barOptions} />
                  : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Currency breakdown + funnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Revenue by Currency</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : !revenue?.revenuePerCurrency.length ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-2">
                {revenue.revenuePerCurrency.map(item => (
                  <div key={item.currency} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                      {item.currency}
                    </span>
                    <span className="font-bold">{item.revenue.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Payment Funnel</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : !pmtStats ? (
              <p className="text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Paid", value: pmtStats.paid, color: "bg-[var(--accent)]" },
                  { label: "Pending", value: pmtStats.pending, color: "bg-amber-500" },
                  { label: "Expired", value: pmtStats.expired, color: "bg-gray-400" },
                  { label: "Failed", value: pmtStats.failed, color: "bg-red-500" },
                ].map(row => {
                  const pct = pmtStats.total > 0 ? (row.value / pmtStats.total) * 100 : 0
                  return (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{row.label}</span>
                        <span className="font-semibold text-foreground">{row.value}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${row.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions table */}
      <div ref={tableRef}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <span className="text-xs text-muted-foreground">Last 10</span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : !txStats?.recentTransactions.length ? (
              <div className="p-10 text-center text-sm text-muted-foreground">No transactions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-left px-5 py-3 font-semibold">Tx Hash</th>
                      <th className="text-right px-5 py-3 font-semibold">Amount</th>
                      <th className="text-center px-5 py-3 font-semibold">Confirmations</th>
                      <th className="text-center px-5 py-3 font-semibold">Status</th>
                      <th className="text-right px-5 py-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {txStats.recentTransactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}</td>
                        <td className="px-5 py-3 text-right font-semibold">{tx.amount} <span className="text-muted-foreground font-normal">{tx.currency}</span></td>
                        <td className="px-5 py-3 text-center text-muted-foreground">{tx.confirmations}</td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={tx.status === "CONFIRMED" ? "default" : "secondary"} className={tx.status === "CONFIRMED" ? "bg-green-50 text-green-700 hover:bg-green-50" : tx.status === "PENDING" ? "bg-amber-50 text-amber-700 hover:bg-amber-50" : "bg-red-50 text-red-600 hover:bg-red-50"}>{tx.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}