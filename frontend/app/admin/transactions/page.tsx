"use client";

import { useEffect, useState } from "react";
import { transactionApi } from "@/services/api";

export default function AllTransactionsPage() {
  const [data, setData] = useState<{ data: any[], total: number }>({ data: [], total: 0 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await transactionApi.findAll_admin(p, 10);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6 flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Transactions</h1>
          <p className="text-text-secondary">Global overview of {data.total || 0} blockchain transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden text-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border font-semibold text-text-secondary">
                <th className="px-6 py-4">TxHash</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">From</th>
                <th className="px-6 py-4">To</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary animate-pulse">Loading global transactions...</td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No transactions found across the platform.</td>
                </tr>
              ) : (
                data.data.map((tx: any) => (
                  <tr key={tx._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-primary truncate max-w-[150px]" title={tx.txHash}>
                      <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {tx.txHash}
                      </a>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {tx.amount} {tx.currency}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500 truncate max-w-[120px]" title={tx.fromAddress}>{tx.fromAddress}</td>
                    <td className="px-6 py-4 font-mono text-gray-500 truncate max-w-[120px]" title={tx.toAddress}>{tx.toAddress}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        tx.status === "CONFIRMED" ? "bg-accent/10 text-accent-dark" : "bg-orange-100 text-orange-600"
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
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/30">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="px-5 py-2.5 bg-white border border-border text-foreground rounded-xl disabled:opacity-50 hover:bg-gray-50 transition font-medium shadow-sm"
          >
            Previous
          </button>
          <span className="text-text-secondary font-medium px-4">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={data.data.length < 10 || isLoading}
            className="px-5 py-2.5 bg-white border border-border text-foreground rounded-xl disabled:opacity-50 hover:bg-gray-50 transition font-medium shadow-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
