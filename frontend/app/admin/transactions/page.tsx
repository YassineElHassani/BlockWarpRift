/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transactionApi } from "@/services/api";
import gsap from "gsap";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink, Globe } from "lucide-react";

export default function AllTransactionsPage() {
  const [data, setData] = useState<{ data: any[]; total: number }>({ data: [], total: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);

  const fetchTransactions = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await transactionApi.findAll_admin(p, 10);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(page); }, [fetchTransactions, page]);

  useEffect(() => {
    if (isLoading) return;
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, { y: -16, opacity: 0, duration: 0.45, ease: "power2.out" });
    });
    return () => ctx.revert();
  }, [isLoading]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / 10));

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      CONFIRMED: "bg-green-50 text-green-700",
      PENDING: "bg-amber-50 text-amber-700",
      FAILED: "bg-red-50 text-red-600",
    };
    return <Badge className={styles[status] ?? "bg-gray-100 text-gray-500"}>{status}</Badge>;
  };

  const truncAddr = (a: string) => a ? `${a.slice(0, 8)}…${a.slice(-4)}` : "—";

  return (
    <>
      <div ref={headerRef} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="h-5 w-5 text-[var(--accent-dark)]" />
          <h1 className="text-2xl font-bold tracking-tight">All Transactions</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-8">
          Global overview of {data.total || 0} blockchain transactions
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
                    <th className="px-5 py-4 text-left font-semibold">TxHash</th>
                    <th className="px-5 py-4 text-right font-semibold">Amount</th>
                    <th className="px-5 py-4 text-left font-semibold">From</th>
                    <th className="px-5 py-4 text-left font-semibold">To</th>
                    <th className="px-5 py-4 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Loading global transactions...</td></tr>
                  ) : data.data.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No transactions found across the platform.</td></tr>
                  ) : (
                    data.data.map((tx: any) => (
                      <tr key={tx._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs">
                          <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1">
                            {tx.txHash.slice(0, 10)}…{tx.txHash.slice(-6)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">{tx.amount} <span className="text-muted-foreground font-normal">{tx.currency}</span></td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground" title={tx.fromAddress}>{truncAddr(tx.fromAddress)}</td>
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground" title={tx.toAddress}>{truncAddr(tx.toAddress)}</td>
                        <td className="px-5 py-4 text-center">{statusBadge(tx.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
