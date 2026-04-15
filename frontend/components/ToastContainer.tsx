'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X, Zap } from 'lucide-react'
import { useToast } from '@/app/context/ToastContext'

export const ToastContainer = () => {
  const { toasts, creditDeltas, removeToast } = useToast()

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, scale: 0.9, filter: 'blur(10px)' }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border
                ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : ''}
                ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
                ${toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
                ${toast.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : ''}
                min-w-[300px] max-w-[450px]
              `}>
                <div className="flex-shrink-0">
                  {toast.type === 'success' && <CheckCircle size={22} />}
                  {toast.type === 'error' && <AlertCircle size={22} />}
                  {toast.type === 'info' && <Info size={22} />}
                  {toast.type === 'warning' && <AlertCircle size={22} />}
                </div>
                
                <p className="text-[13px] font-bold tracking-tight leading-relaxed flex-grow">
                  {toast.message}
                </p>

                <button 
                  onClick={() => removeToast(toast.id)}
                  className="opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Credit Delta Animations */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
        <AnimatePresence>
          {creditDeltas.map((delta) => (
            <motion.div
              key={delta.id}
              initial={{ opacity: 0, y: 20, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -100, scale: [0.5, 1.2, 1, 0.8] }}
              transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1], ease: "easeOut" }}
              className={`
                flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl backdrop-blur-3xl border-2
                ${delta.type === 'increment' 
                  ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400' 
                  : 'bg-red-500/20 border-red-500 text-red-500'}
              `}
            >
              <Zap size={20} fill="currentColor" />
              <span className="text-2xl font-black italic tracking-tighter">
                {delta.type === 'increment' ? '+' : '-'}{delta.amount} CREDITS
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
