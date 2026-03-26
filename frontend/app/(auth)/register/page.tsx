/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/api";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await authApi.register({ email, password });
      // On successful registration, redirect to login
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 mt-50">
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
        <p className="text-sm text-text-secondary">Start processing Web3 payments today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-slide-in">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-secondary pl-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-colors outline-none text-foreground placeholder:text-gray-400"
            placeholder="merchant@example.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-text-secondary pl-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-colors outline-none text-foreground placeholder:text-gray-400"
            placeholder="Min. 8 characters"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-foreground text-white rounded-xl font-medium shadow hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 flex justify-center items-center mt-4"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Create Account"}
        </button>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
