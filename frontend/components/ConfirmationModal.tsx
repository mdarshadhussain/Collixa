'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react'
import Button from './Button'

export type ModalMode = 'danger' | 'warning' | 'success' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  mode?: ModalMode
  loading?: boolean
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  mode = 'info',
  loading = false
}: ConfirmationModalProps) {
  
  const config = {
    danger: {
      icon: ShieldAlert,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      accent: 'bg-red-500',
      border: 'border-red-500/20'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      accent: 'bg-amber-500',
      border: 'border-amber-500/20'
    },
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      accent: 'bg-emerald-500',
      border: 'border-emerald-500/20'
    },
    info: {
      icon: Info,
      color: 'text-[var(--color-accent)]',
      bg: 'bg-[var(--color-accent-soft)]/20',
      accent: 'bg-[var(--color-accent)]',
      border: 'border-[var(--color-accent)]/20'
    }
  }

  const { icon: Icon, color, bg, accent, border } = config[mode]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative w-full max-w-sm bg-[var(--color-bg-secondary)] border ${border} rounded-[2.5rem] p-8 shadow-2xl overflow-hidden`}
          >
            {/* Design Accents */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${accent}`} />
            
            <div className="flex flex-col items-center text-center space-y-6 pt-4">
              <div className={`w-20 h-20 ${bg} ${color} rounded-[2rem] flex items-center justify-center shadow-inner`}>
                <Icon size={40} className="drop-shadow-sm" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black tracking-tight text-[var(--color-text-primary)]">
                  {title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed px-4 opacity-70 italic">
                  {message}
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 mt-4">
                <Button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl ${accent} text-[var(--color-inverse-text)] text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    confirmText
                  )}
                </Button>
                
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {cancelText}
                </button>
              </div>
            </div>

            {/* Close Icon (Top Right) */}
            {!loading && (
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] rounded-full transition-all opacity-40 hover:opacity-100"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
