/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState, use } from "react";
import { paymentApi } from "@/services/api";
import { usePaymentSocket } from "@/hooks/useSocket";

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchPayment = useCallback(async (silent = false) => {
    try {
      const { data } = await paymentApi.findPublic(id);
      setPayment(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Payment not found or expired.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPayment(); }, [fetchPayment]);

  // Real-time updates — silently re-fetch on any payment event
  usePaymentSocket(id, {
    onUpdated: () => { fetchPayment(true); },
    onConfirmed: () => { fetchPayment(true); },
  });

  const handleCopy = async () => {
    if (payment?.walletAddress) {
      await navigator.clipboard.writeText(payment.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
     return <div className="min-h-screen flex items-center justify-center">Loading checkout...</div>;
  }

  if (error || !payment) {
     return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">{error}</div>;
  }

  const isPaid = payment.status === "PAID";
  const isExpired = payment.status === "EXPIRED";

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-background border-[3px] border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden text-center relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary to-accent" />
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-foreground mb-1">Payment Request</h2>
          <p className="text-text-secondary text-sm mb-6">{payment.description || "Complete your checkout"}</p>

          <div className="mb-8">
            <span className="text-5xl font-black text-foreground tracking-tight">{payment.amount} </span>
            <span className="text-2xl font-bold text-text-secondary">{payment.currency}</span>
          </div>

          <div className="bg-muted rounded-2xl p-6 flex items-center justify-center mx-auto w-fit mb-6 border border-border">
            {isPaid ? (
               <div className="w-48 h-48 flex items-center justify-center flex-col text-accent-dark">
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                 <span className="mt-4 font-bold text-xl">Payment Received</span>
               </div>
            ) : isExpired ? (
               <div className="w-48 h-48 flex items-center justify-center flex-col text-red-500">
                 <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                 <span className="mt-4 font-bold text-xl">Request Expired</span>
               </div>
            ) : payment.qrCode ? (
               <div className="p-3 bg-white rounded-2xl shadow-sm border border-border">
                 <img src={payment.qrCode} alt="Payment QR Code" width="192" height="192" className="rounded-lg" />
               </div>
            ) : (
               <div className="w-48 h-48 flex items-center justify-center text-text-secondary">QR unavailable</div>
            )}
          </div>

          {!isPaid && !isExpired && (
            <div className="text-left bg-muted/50 border border-border p-2 rounded-xl mb-4 max-w-sm mx-auto overflow-hidden">
               <p className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider px-2 mt-1">Send exactly {payment.amount} {payment.currency} to</p>
               <div className="flex items-center justify-between gap-3 p-2 bg-background border border-border shadow-sm rounded-lg mt-2">
                 <p className="font-mono text-sm text-foreground truncate">{payment.walletAddress}</p>
                 <button 
                   onClick={handleCopy}
                   className="p-2 hover:bg-muted text-text-secondary hover:text-foreground rounded-md transition-colors shrink-0"
                   title="Copy Address"
                 >
                   {copied ? (
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 animate-in fade-in zoom-in duration-200">
                       <path d="M20 6L9 17l-5-5"></path>
                     </svg>
                   ) : (
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-in fade-in zoom-in duration-200">
                       <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                       <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                     </svg>
                   )}
                 </button>
               </div>
            </div>
          )}

          <div className="flex justify-center items-center mt-6">
             {!isPaid && !isExpired ? (
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 Waiting for payment...

               </div>
             ) : isPaid ? (
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent-dark font-medium rounded-full text-sm">
                 Transaction Confirmed
               </div>
             ) : (
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 font-medium rounded-full text-sm">
                 Time elapsed. Create a new request.
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
