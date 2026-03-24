import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[85vh] bg-background flex flex-col items-center justify-center p-6 text-center z-50 relative animate-fade-in">
      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-3xl -z-10" />
      
      <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-red-500/20">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-foreground mb-4">403 Forbidden</h1>
      <p className="text-text-secondary max-w-md mx-auto mb-10 text-lg">
        You do not have the required permissions to access this page. Ensure you are logged in with the correct role.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/dashboard" 
          className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl shadow hover:bg-foreground/80 transition-all duration-300"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
