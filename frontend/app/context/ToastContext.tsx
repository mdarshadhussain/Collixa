'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { eventBus } from '@/lib/events'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export interface CreditDelta {
  id: string
  amount: number
  type: 'increment' | 'decrement'
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showCreditAnimation: (amount: number) => void
  toasts: Toast[]
  creditDeltas: CreditDelta[]
  removeToast: (id: string) => void
  removeCreditDelta: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [creditDeltas, setCreditDeltas] = useState<CreditDelta[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const removeCreditDelta = useCallback((id: string) => {
    setCreditDeltas((prev) => prev.filter((delta) => delta.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type, duration }])
    
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [removeToast])

  const showCreditAnimation = useCallback((amount: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setCreditDeltas((prev) => [
      ...prev, 
      { id, amount: Math.abs(amount), type: amount >= 0 ? 'increment' : 'decrement' }
    ])

    setTimeout(() => {
      removeCreditDelta(id)
    }, 3000)
  }, [removeCreditDelta])

  useEffect(() => {
    const unsubToast = eventBus.subscribeToast(({ message, type, duration }) => {
      showToast(message, type, duration)
    })
    const unsubCredit = eventBus.subscribeCredit(({ amount }) => {
      showCreditAnimation(amount)
    })
    return () => {
      unsubToast()
      unsubCredit()
    }
  }, [showToast, showCreditAnimation])

  return (
    <ToastContext.Provider value={{ showToast, showCreditAnimation, toasts, creditDeltas, removeToast, removeCreditDelta }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
