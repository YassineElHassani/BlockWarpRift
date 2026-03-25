import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center z-50 relative animate-fade-in">
      {/* Background Blurs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <h1 className="text-9xl font-black text-foreground mb-4 select-none">404</h1>
      <h2 className="text-3xl font-bold text-foreground mb-6">Page Not Found</h2>
      <p className="text-text-secondary max-w-md mx-auto mb-10 text-lg">
        The route you are looking for does not exist or has been moved to another dimension in the BlockWarpRift.
      </p>
      
      <Link 
        href="/" 
        className="px-8 py-4 bg-foreground text-background font-semibold rounded-xl shadow hover:bg-foreground/80 transition-all duration-300 flex items-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"></path>
          <path d="M12 19l-7-7 7-7"></path>
        </svg>
        Return to Safety
      </Link>
    </div>
  );
}
