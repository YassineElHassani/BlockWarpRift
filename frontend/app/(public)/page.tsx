"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AetherFlowHero from "@/components/ui/aether-flow-hero";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Features Scroll Animations
      gsap.from(".feature-item", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
      });
    }, [featuresRef]);

    return () => ctx.revert(); // Cleanup GSAP on unmount
  }, []);

  return (
    <main className="flex flex-col items-center overflow-x-hidden">
      {/* Dynamic Animated Canvas Hero */}
      <AetherFlowHero />

      {/* Features Section */}
      <section
        ref={featuresRef}
        className="w-full bg-muted/50 border-y border-border py-32 relative"
      >
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Architecture of the Future</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              Built with a pristine focus on performance, security, and developer experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Websockets",
                desc: "Clients never refresh. WebSockets deliver block confirmations to the checkout UI instantly.",
                icon: "M13 10V3L4 14h7v7l9-11h-7z"
              },
              {
                title: "EIP-681 Compliance",
                desc: "Render frictionless QR codes perfectly readable by all major mobile Web3 wallets.",
                icon: "M3 3h7v7H3zm11 0h7v7h-7zm0 11h7v7h-7zm-11 0h7v7H3z"
              },
              {
                title: "Extensive Analytics",
                desc: "Measure multi-currency revenue flows visually with powerful aggregation pipelines.",
                icon: "M3 3v18h18M9 9l4 4 6-6"
              }
            ].map((f, i) => (
              <div key={i} className="feature-item bg-white p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-6 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
                    <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-semibold text-lg tracking-tight text-foreground">
                  BlockWarp<span className="text-primary">Rift</span>
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                The open crypto payment infrastructure for the modern web.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product</p>
              <ul className="space-y-2.5">
                {["Dashboard", "Payments", "Analytics", "Transactions"].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developers */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Developers</p>
              <ul className="space-y-2.5">
                {["Documentation", "API Reference", "EIP-681 Spec", "Webhooks"].map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider + bottom bar */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2026 BlockWarpRift. All rights reserved.</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-dark)] animate-pulse inline-block" />
              Ethereum Sepolia Testnet
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}