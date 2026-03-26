import Link from "next/link";

export default function SolutionsPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 container mx-auto max-w-7xl animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Payment Solutions for the Modern Web</h1>
        <p className="text-xl text-text-secondary">Accept cryptocurrency seamlessly. Expand your global reach with instant settlement and zero chargebacks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-white p-10 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">E-Commerce Integration</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Integrate directly into Shopify, WooCommerce, or your custom storefront. Provide your customers with a smooth Web3 checkout experience using auto-generated mobile QR codes for easy wallet scanning.
            </p>
          </div>
          <Link href="/register" className="text-primary font-semibold hover:underline inline-flex items-center gap-1 mt-4">
            Start Selling <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent-dark mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">SaaS Billing</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Handle one-time payments for your software products. Our robust dashboard provides deep analytics into revenue by cryptocurrency, ensuring your finance team has exactly what they need.
            </p>
          </div>
          <Link href="/register" className="text-accent-dark font-semibold hover:underline inline-flex items-center gap-1 mt-4">
            Explore Dashboard <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
