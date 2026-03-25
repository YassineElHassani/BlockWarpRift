/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { analyticsApi } from "@/services/api";
import RevenueChart from "@/components/dashboard/RevenueChart";

export default function DashboardPage() {
  const [revenue, setRevenue] = useState<any>(null);
  const [txnStats, setTxnStats] = useState<any>(null);
  const [payStats, setPayStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, txnRes, payRes] = await Promise.all([
          analyticsApi.revenue(),
          analyticsApi.transactions(),
          analyticsApi.payments(),
        ]);
        setRevenue(revRes.data);
        setTxnStats(txnRes.data);
        setPayStats(payRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 container mx-auto px-6 max-w-7xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-text-secondary mt-1">Track your real-time crypto revenue and metrics.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`$${revenue?.totalRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}`} />
        <StatCard title="Confirmed Txs" value={txnStats?.confirmed || 0} />
        <StatCard title="Pending Payments" value={payStats?.pending || 0} />
        <StatCard title="Failed Txs" value={txnStats?.failed || 0} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-6 text-foreground">Revenue Over Time</h2>
          <div className="h-[300px] w-full">
            {revenue?.revenueByDay?.length > 0 ? (
              <RevenueChart data={revenue.revenueByDay} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary">
                No revenue data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Currency Breakdown & Recent */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">By Currency</h2>
            <div className="space-y-4">
              {revenue?.revenuePerCurrency?.map((curr: any) => (
                <div key={curr.currency} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-text-secondary">
                      {curr.currency[0]}
                    </div>
                    <span className="font-medium text-foreground">{curr.currency}</span>
                  </div>
                  <span className="font-semibold text-foreground">
                    ${curr.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {!revenue?.revenuePerCurrency?.length && (
                <p className="text-text-secondary text-sm">No data yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Transactions</h2>
            <div className="space-y-3">
              {txnStats?.recentTransactions?.slice(0, 5).map((tx: any) => (
                <div key={tx._id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-foreground truncate max-w-[120px]" title={tx.txHash}>
                      {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                    </p>
                    <p className="text-text-secondary text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{tx.amount} {tx.currency}</p>
                    <p className={`text-xs font-medium ${tx.status === 'CONFIRMED' ? 'text-accent-dark' : 'text-orange-500'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
              {!txnStats?.recentTransactions?.length && (
                <p className="text-text-secondary text-sm">No transactions yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, color = "text-foreground" }: { title: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-text-secondary mb-2">{title}</p>
      <p className={`text-3xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}
