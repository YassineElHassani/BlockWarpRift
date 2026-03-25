/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { transactionApi } from "@/services/api";
import { useMultiPaymentSocket } from "@/hooks/useSocket";

export default function TransactionsPage() {
  const [data, setData] = useState<{ data: any[], total: number }>({ data: [], total: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTxs = useCallback(async (p: number) => {
    setIsLoading(true);
    try {
      const res = await transactionApi.findAll(p, 10);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTxs(page);
  }, [fetchTxs, page]);

  // Re-fetch when any tracked payment confirms
  const paymentIds = data.data
    .map((tx: any) => tx.paymentId)
    .filter(Boolean)
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

  useMultiPaymentSocket(paymentIds, () => {
    fetchTxs(page);
  });

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / 10));

  return (
    <main className="flex-1 container mx-auto px-6 max-w-7xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
        <p className="text-text-secondary mt-1">Found {data.total || 0} blockchain transactions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted bg-opacity-50 text-text-secondary text-sm border-b border-border">
                <th className="px-6 py-4 font-semibold">TxHash</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Confirmations</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    Loading transactions...
                  </td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                data.data.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-primary truncate max-w-[200px]" title={tx.txHash}>
                      <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {tx.txHash}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {tx.confirmations}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${tx.status === "CONFIRMED" ? "bg-accent/10 text-accent-dark" : "bg-orange-100 text-orange-600"
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-white text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-4 py-2 text-foreground font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-text-secondary font-medium">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="px-4 py-2 text-foreground font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
