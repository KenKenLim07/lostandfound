"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import { X } from "lucide-react"

export type ToastVariant = "default" | "success" | "destructive"

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID()
    const next: Toast = { id, durationMs: 3000, variant: "default", ...t }
    setToasts((prev) => [...prev, next])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, next.durationMs)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[10000] flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                "pointer-events-auto rounded-md border bg-white shadow-md dark:bg-neutral-900 " +
                (t.variant === "success"
                  ? "border-green-600/30"
                  : t.variant === "destructive"
                  ? "border-red-600/30"
                  : "border-border")
              }
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex-1">
                  {t.title && (
                    <div className="text-sm font-medium">{t.title}</div>
                  )}
                  {t.description && (
                    <div className="text-sm text-muted-foreground">{t.description}</div>
                  )}
                </div>
                <button
                  aria-label="Dismiss notification"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                  onClick={() => dismiss(t.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
} 