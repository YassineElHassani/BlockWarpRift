"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"
import { usersApi } from "@/services/api"

export function useMetaMask() {
  const { user, login, token } = useAuthStore()
  const [account, setAccount] = useState<string | null>(user?.walletAddress ?? null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync from store on hydrate
  useEffect(() => {
    if (user?.walletAddress) setAccount(user.walletAddress)
  }, [user?.walletAddress])

  const connect = useCallback(async () => {
    setError(null)

    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[]

      const address = accounts[0]
      if (!address) throw new Error("No account returned")

      // Persist to backend
      await usersApi.updateWallet(address)

      // Update local store
      if (token && user) {
        login(token, { ...user, walletAddress: address })
      }
      setAccount(address)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet"
      setError(msg)
    } finally {
      setIsConnecting(false)
    }
  }, [token, user, login])

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[]
      if (accounts.length === 0) {
        setAccount(null)
      } else if (accounts[0] !== account) {
        // Auto-update when user switches account in MetaMask
        const newAddr = accounts[0]
        setAccount(newAddr)
        usersApi.updateWallet(newAddr).catch(() => {})
        if (token && user) {
          login(token, { ...user, walletAddress: newAddr })
        }
      }
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
    }
  }, [account, token, user, login])

  return { account, isConnecting, error, connect }
}
