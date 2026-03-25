"use client";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Control Center</h1>
        <p className="text-text-secondary">Overview of platform operations and management</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Link href="/admin/users" className="block p-8 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Manage Users</h2>
          <p className="text-text-secondary">View and manage all registered merchant accounts on the platform.</p>
        </Link>
        <Link href="/admin/transactions" className="block p-8 bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition hover:-translate-y-1">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent-dark mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Platform Transactions</h2>
          <p className="text-text-secondary">Monitor all cryptocurrency transactions across all merchants globally.</p>
        </Link>
      </div>
    </div>
  );
}
