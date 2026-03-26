"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import classNames from "classnames";
import { useAuthStore } from "@/store/auth.store";

export default function Navbar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Initial entrance animation
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  const navLinks = hydrated && isAuthenticated
    ? user?.role === "ADMIN"
      ? [
          { name: "Admin Dashboard", path: "/admin/dashboard" },
          { name: "Manage Users", path: "/admin/users" },
          { name: "All Transactions", path: "/admin/transactions" },
        ]
      : [
          { name: "Dashboard", path: "/dashboard" },
          { name: "Payments", path: "/dashboard/payments" },
          { name: "Transactions", path: "/dashboard/transactions" },
        ]
    : [
        { name: "Solutions", path: "/solutions" },
        { name: "Developers", path: "/developers" },
      ];

  return (
    <header
      ref={navRef}
      className={classNames(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b",
        {
          "bg-white/80 backdrop-blur-md border-border/50 py-3 shadow-sm": isScrolled,
          "bg-transparent border-transparent py-5": !isScrolled,
        }
      )}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-105 transition-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight text-foreground">
            BlockWarp<span className="text-primary">Rift</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={classNames(
                "text-sm font-medium transition-all duration-200 relative group py-1",
                pathname === link.path ? "text-primary" : "text-text-secondary hover:text-foreground"
              )}
            >
              {link.name}
              <span
                className={classNames(
                  "absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-300",
                  pathname === link.path ? "w-full" : "w-0 group-hover:w-full"
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {hydrated && isAuthenticated ? (
            <button
              onClick={logout}
              className="text-sm font-medium text-text-secondary hover:text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-foreground transition-colors hidden md:block">
                Log in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-foreground text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
