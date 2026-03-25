/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { paymentApi } from "@/services/api";
import { useMultiPaymentSocket } from "@/hooks/useSocket";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPayments = useCallback(async () => {
    try {
      const { data } = await paymentApi.findAll();
      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Re-fetch silently when any payment status changes
  const paymentIds = payments.map((p: any) => p._id).filter(Boolean);
  useMultiPaymentSocket(paymentIds, () => { fetchPayments(); });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await paymentApi.create({
        amount: Number(amount),
        currency: "ETH",
        description,
      });
      setPayments([data, ...payments]);
      setAmount("");
      setDescription("");
      showToast("Payment request created! Share the checkout link.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to create payment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <main className="flex-1 container mx-auto px-6 max-w-7xl py-12">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Create Form */}
        <div className="md:w-1/3 bg-white p-6 rounded-2xl border border-border shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4">Request Payment</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-secondary">Amount</label>
              <input
                type="number"
                step="0.000001"
                min="0.000001"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl focus:border-primary outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Currency</label>
              <div className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground font-medium">
                ETH
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-muted border border-border rounded-xl focus:border-primary outline-none"
                placeholder="Order #1234"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-foreground text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {isSubmitting ? "Creating..." : "Generate Request"}
            </button>
          </form>
        </div>

        {/* Payments List */}
        <div className="md:w-2/3 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/30">
            <h2 className="text-xl font-bold">Payment Intents</h2>
          </div>
          <ul className="divide-y divide-border">
            {payments.map(p => (
              <li key={p._id} className="p-6 hover:bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition">
                <div>
                  <p className="font-semibold text-foreground text-lg">{p.amount} {p.currency}</p>
                  <p className="text-sm text-text-secondary line-clamp-1">{p.description || "No description"}</p>
                  <p className="text-xs text-text-secondary mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.status === "PAID" ? "bg-accent/10 text-accent-dark" :
                      p.status === "PENDING" ? "bg-orange-100 text-orange-600" :
                        "bg-red-100 text-red-600"
                    }`}>
                    {p.status}
                  </span>
                  <Link
                    href={`/checkout/${p._id}`}
                    target="_blank"
                    className="px-4 py-2 text-sm font-medium bg-primary-light text-primary hover:bg-primary hover:text-white rounded-lg transition"
                  >
                    Checkout Link
                  </Link>
                </div>
              </li>
            ))}
            {payments.length === 0 && (
              <div className="p-12 text-center text-text-secondary">
                No payment requests found. Create one.
              </div>
            )}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl font-medium ${
              toast.type === "success" 
                ? "bg-green-500 text-white" 
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
