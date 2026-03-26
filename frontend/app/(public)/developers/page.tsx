"use client";

export default function DevelopersPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 container mx-auto max-w-7xl animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Built for Developers</h1>
        <p className="text-xl text-text-secondary">Integrate Next-Gen Crypto Payments in minutes with our robust, typed APIs and Webhooks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
        <div className="space-y-6">
          <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </div>
          <h2 className="text-3xl font-bold">Simple Integration</h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Create payment intents with a single REST API call. We handle address generation, WebSocket confirmations, and status synchronization automatically.
          </p>
        </div>
        <div className="bg-muted border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="flex gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <pre className="text-sm font-mono text-gray-700 overflow-x-auto">
            <code>
{`// Create a payment request
const res = await fetch("api/payment/create", {
  method: "POST",
  headers: { "Authorization": \`Bearer \${API_KEY}\` },
  body: JSON.stringify({
    amount: 0.05,
    currency: "ETH",
    description: "Order #4091"
  })
});

const { paymentUrl } = await res.json();
console.log(paymentUrl);`}
            </code>
          </pre>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { title: "WebHooks", desc: "Receive immediate HTTP callbacks when blocks confirm.", icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" },
          { title: "SDKs", desc: "Native drop-in UI libraries for React, Vue, and iOS/Android.", icon: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" },
          { title: "Testing environment", desc: "Use the Sepolia testnet to safely test un-mined txns.", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" }
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={f.icon}></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-text-secondary">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
