"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Globe, Shield, ArrowRight, ArrowLeftRight, Coins } from "lucide-react";
import { transactionApi, usersApi } from "@/services/api";

const panels = [
  {
    href: "/admin/users",
    title: "Manage Users",
    desc: "View and remove merchant accounts registered on the platform.",
    icon: Users,
    gradient: "from-[var(--primary)] to-[var(--primary-dark)]",
    text: "text-[var(--primary)]",
  },
  {
    href: "/admin/transactions",
    title: "Platform Transactions",
    desc: "Monitor all cryptocurrency transactions across all merchants globally.",
    icon: Globe,
    gradient: "from-[var(--accent)] to-[var(--accent-dark)]",
    text: "text-[var(--accent-dark)]",
  },
];

export default function AdminDashboard() {
  const headerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({ totalTx: 0, totalAmount: 0, totalUsers: 0, totalPayments: 0 });
  const [loaded, setLoaded] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [txRes, usersRes] = await Promise.all([
        transactionApi.findAll_admin(1, 10000),
        usersApi.findAll(),
      ]);

      const allTx = txRes.data?.data ?? [];
      const totalTx = txRes.data?.total ?? 0;
      const users = usersRes.data ?? [];

      const totalAmount = allTx.reduce(
        (sum: number, tx: { status: string; amount: number }) =>
          tx.status === "CONFIRMED" ? sum + (tx.amount || 0) : sum,
        0
      );

      const totalPayments = allTx.length;

      setStats({
        totalTx,
        totalAmount: Math.round(totalAmount * 10000) / 10000,
        totalUsers: users.length,
        totalPayments,
      });
    } catch (err) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!headerRef.current || !loaded) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.45, ease: "power2.out" });
    });
    return () => ctx.revert();
  }, [loaded]);

  const kpis = [
    { label: "Total Transactions", value: stats.totalTx, icon: ArrowLeftRight, color: "text-[var(--accent-dark)]", bg: "bg-[var(--accent)]/10" },
    { label: "Total Revenue", value: `${stats.totalAmount} ETH`, icon: Coins, color: "text-[var(--primary)]", bg: "bg-[var(--primary)]/10" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Payment Requests", value: stats.totalPayments, icon: Globe, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <>
      <div ref={headerRef} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Control Center</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-[52px]">Overview of platform operations and management</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.35 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-foreground">
                  {loaded ? kpi.value : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Navigation Panels */}
      <div className="grid md:grid-cols-2 gap-6">
        {panels.map((panel, i) => (
          <motion.div
            key={panel.href}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
          >
            <Link href={panel.href} className="block group">
              <Card className="border border-border hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${panel.gradient} flex items-center justify-center mb-6 shadow-sm`}>
                    <panel.icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-foreground">{panel.title}</h2>
                  <p className="text-muted-foreground text-sm mb-4">{panel.desc}</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${panel.text} group-hover:gap-2.5 transition-all`}>
                    Open <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
