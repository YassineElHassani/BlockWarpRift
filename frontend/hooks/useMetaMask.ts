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
      setError("No MetaMask or compatible wallet is installed")
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
      if ((err as { code?: number })?.code === 4001) {
        // User rejected — do nothing
      } else {
        setError(err instanceof Error ? err.message : "Failed to connect wallet")
      }
    } finally {
      setIsConnecting(false)
    }
  }, [token, user, login])

  const disconnect = useCallback(async () => {
    try {
      await usersApi.updateWallet("")
      if (token && user) {
        login(token, { ...user, walletAddress: undefined })
      }
      setAccount(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect wallet"
      setError(msg)
    }
  }, [token, user, login])

  const reconnect = useCallback(async () => {
    setError(null)
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No MetaMask or compatible wallet is installed")
      return
    }
    setIsConnecting(true)
    try {
      // Force MetaMask account picker
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })
      const accounts = (await window.ethereum.request({
        method: "eth_accounts",
      })) as string[]
      const address = accounts[0]
      if (!address) throw new Error("No account selected")
      await usersApi.updateWallet(address)
      if (token && user) {
        login(token, { ...user, walletAddress: address })
      }
      setAccount(address)
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 4001) {
        // User rejected — do nothing
      } else {
        setError(err instanceof Error ? err.message : "Failed to switch wallet")
      }
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

  return { account, isConnecting, error, connect, disconnect, reconnect }
}
