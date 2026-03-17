"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"
import gsap from "gsap"
import { analyticsApi } from "@/services/api"
import type { RevenueData, TransactionStatsData, PaymentStatsData } from "@/types"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className={`text-3xl font-black tracking-tight ${accent ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sub}</p>}
    </div>
  )
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [txStats, setTxStats] = useState<TransactionStatsData | null>(null)
  const [pmtStats, setPmtStats] = useState<PaymentStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
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
      if (cardsRef.current?.children) {
        gsap.from(cardsRef.current.children, {
          y: 20,
          opacity: 0,
          duration: 0.4,
          stagger: 0.08,
          delay: 0.1,
          ease: "power2.out",
        })
      }
      gsap.from(chartRef.current, { y: 24, opacity: 0, duration: 0.5, delay: 0.35, ease: "power3.out" })
      gsap.from(tableRef.current, { y: 24, opacity: 0, duration: 0.5, delay: 0.5, ease: "power3.out" })
    })
    return () => ctx.revert()
  }, [loading])

  // Chart data
  const revenueChartData = {
    labels: revenue?.revenueByDay.map(d => {
      const dt = new Date(d.date)
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }) ?? [],
    datasets: [
      {
        label: "Revenue",
        data: revenue?.revenueByDay.map(d => d.revenue) ?? [],
        borderColor: "#6c47ff",
        backgroundColor: "rgba(108,71,255,0.08)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#6c47ff",
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        borderColor: "#e4e4f0",
        borderWidth: 1,
        titleColor: "#111",
        bodyColor: "#6b7280",
        padding: 10,
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${Number(ctx.raw).toFixed(4)} ETH`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
      y: {
        grid: { color: "#f0f0f5" },
        ticks: { color: "#9ca3af", font: { size: 11 } },
      },
    },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div ref={headerRef} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Revenue and transaction performance overview</p>
      </div>

      {/* Stat cards — top row */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Revenue"
            value={revenue?.totalRevenue ? `${revenue.totalRevenue.toFixed(4)}` : "—"}
            sub="ETH confirmed on-chain"
            accent="text-[var(--primary)]"
          />
          <StatCard
            label="Total Payments"
            value={pmtStats?.total ?? "—"}
            sub={`${pmtStats?.paid ?? 0} paid · ${pmtStats?.pending ?? 0} pending`}
          />
          <StatCard
            label="Tx Confirmed"
            value={txStats?.confirmed ?? "—"}
            sub={`${txStats?.failed ?? 0} failed · ${txStats?.pending ?? 0} pending`}
          />
          <StatCard
            label="Conversion"
            value={
              pmtStats?.total
                ? `${((pmtStats.paid / pmtStats.total) * 100).toFixed(0)}%`
                : "—"
            }
            sub="Paid / total payments"
            accent="text-[var(--accent)]"
          />
        </div>
      )}

      {/* Revenue chart */}
      <div ref={chartRef} className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Revenue over time</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daily confirmed revenue (ETH)</p>
          </div>
          {revenue?.revenueByDay.length === 0 && !loading && (
            <span className="text-xs text-[var(--text-secondary)]">No confirmed transactions yet</span>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-52" />
        ) : (
          <div style={{ height: 220 }}>
            {revenue && revenue.revenueByDay.length > 0 ? (
              <Line data={revenueChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[var(--text-secondary)]">
                No revenue data available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Currency breakdown + payment funnel side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Per-currency revenue */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Revenue by currency</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : !revenue?.revenuePerCurrency.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No data yet</p>
          ) : (
            <div className="space-y-2">
              {revenue.revenuePerCurrency.map(item => (
                <div key={item.currency} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-gray-700">
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    {item.currency}
                  </span>
                  <span className="font-bold text-gray-900">{item.revenue.toFixed(4)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment funnel */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Payment status breakdown</h2>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : !pmtStats ? (
            <p className="text-sm text-[var(--text-secondary)]">No data yet</p>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Paid", value: pmtStats.paid, color: "bg-green-400" },
                { label: "Pending", value: pmtStats.pending, color: "bg-yellow-400" },
                { label: "Expired", value: pmtStats.expired, color: "bg-gray-300" },
                { label: "Failed", value: pmtStats.failed, color: "bg-red-400" },
              ].map(row => {
                const pct = pmtStats.total > 0 ? (row.value / pmtStats.total) * 100 : 0
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{row.label}</span>
                      <span className="font-semibold text-gray-700">{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent transactions</h2>
          <span className="text-xs text-[var(--text-secondary)]">Last 10</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : !txStats?.recentTransactions.length ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No transactions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-[var(--border)]">
                  <th className="text-left px-5 py-3 font-semibold">Tx Hash</th>
                  <th className="text-right px-5 py-3 font-semibold">Amount</th>
                  <th className="text-center px-5 py-3 font-semibold">Confirmations</th>
                  <th className="text-center px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {txStats.recentTransactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-[var(--muted)] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {tx.amount} <span className="text-gray-400 font-normal">{tx.currency}</span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-500">{tx.confirmations}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.status === "CONFIRMED"
                          ? "bg-green-50 text-green-700"
                          : tx.status === "PENDING"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
