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
      <footer className="w-full py-12 text-center text-text-secondary border-t border-border mt-auto">
        <p>© 2026 BlockWarpRift Foundation. Neutral & Clean design.</p>
      </footer>
    </main>
  );
}