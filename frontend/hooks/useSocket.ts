"use client"

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { env } from "@/config/env"
import type { PaymentStatus } from "@/types"

export interface PaymentUpdatedPayload {
  paymentId: string
  status?: PaymentStatus
  [key: string]: unknown
}

type PaymentEventCallback = (payload: PaymentUpdatedPayload) => void

/**
 * Connects to the backend Socket.io server and subscribes to a payment room.
 * Calls the provided callbacks when `payment.updated` or `payment.confirmed` events arrive.
 * Automatically cleans up on unmount.
 */
export function usePaymentSocket(
  paymentId: string | undefined,
  {
    onUpdated,
    onConfirmed,
  }: {
    onUpdated?: PaymentEventCallback
    onConfirmed?: PaymentEventCallback
  }
) {
  const socketRef = useRef<Socket | null>(null)
  const onUpdatedRef = useRef(onUpdated)
  const onConfirmedRef = useRef(onConfirmed)

  // Keep refs current without triggering reconnect
  useEffect(() => { onUpdatedRef.current = onUpdated }, [onUpdated])
  useEffect(() => { onConfirmedRef.current = onConfirmed }, [onConfirmed])

  const subscribe = useCallback(() => {
    if (!paymentId) return

    const socket = io(env.SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      socket.emit("subscribe_payment", paymentId)
    })

    socket.on("payment.updated", (payload: PaymentUpdatedPayload) => {
      onUpdatedRef.current?.(payload)
    })

    socket.on("payment.confirmed", (payload: PaymentUpdatedPayload) => {
      onConfirmedRef.current?.(payload)
    })

    return () => {
      socket.emit("unsubscribe_payment", paymentId)
      socket.disconnect()
      socketRef.current = null
    }
  }, [paymentId])

  useEffect(() => {
    const cleanup = subscribe()
    return () => cleanup?.()
  }, [subscribe])

  return socketRef
}

/**
 * Subscribes to multiple payment rooms on a single socket connection.
 * Calls onAnyUpdate when any payment in the provided list changes.
 * Useful for the dashboard list view.
 */
export function useMultiPaymentSocket(
  paymentIds: string[],
  onAnyUpdate: (payload: PaymentUpdatedPayload) => void
) {
  const socketRef = useRef<Socket | null>(null)
  const callbackRef = useRef(onAnyUpdate)
  useEffect(() => { callbackRef.current = onAnyUpdate }, [onAnyUpdate])

  useEffect(() => {
    if (!paymentIds.length) return

    const socket = io(env.SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on("connect", () => {
      paymentIds.forEach(pid => socket.emit("subscribe_payment", pid))
    })

    const handler = (payload: PaymentUpdatedPayload) => callbackRef.current(payload)
    socket.on("payment.updated", handler)
    socket.on("payment.confirmed", handler)

    return () => {
      paymentIds.forEach(pid => socket.emit("unsubscribe_payment", pid))
      socket.disconnect()
      socketRef.current = null
    }
  // Stringify to avoid re-connecting on every render when array reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentIds.join(",")])
}
