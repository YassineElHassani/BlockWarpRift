"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Trigger page transition on route change
    gsap.fromTo(
      wrapperRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "all" }
    );
  }, [pathname]);

  return (
    <div ref={wrapperRef} className="pt-24 min-h-screen flex flex-col">
      {children}
    </div>
  );
}
