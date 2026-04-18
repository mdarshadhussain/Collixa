'use client'

import Link from 'next/link'
import { Home, Sparkles, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-6 lg:p-12 font-sans overflow-hidden relative">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--color-accent)] rounded-full blur-[160px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500 rounded-full blur-[160px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative inline-flex"
        >
           <h1 className="text-[120px] md:text-[180px] font-serif font-black tracking-tighter text-[var(--color-text-primary)] leading-none select-none drop-shadow-2xl">
             4<span className="italic font-light text-[var(--color-accent)]">0</span>4
           </h1>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
             <span className="px-6 py-2 bg-[var(--color-bg-secondary)]/80 backdrop-blur-md rounded-full border border-[var(--color-border)] text-xs font-black uppercase tracking-[0.4em] shadow-xl text-[var(--color-text-secondary)]">
               Sector Uncharted
             </span>
           </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tighter text-[var(--color-text-primary)]">The page vanished.</h2>
          <p className="text-[var(--color-text-secondary)] font-medium max-w-md mx-auto leading-relaxed">
            We couldn't locate the intent you're searching for. It might have been archived, moved, or restricted.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-lg mx-auto"
        >
          <Link href="/" className="flex-1">
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--color-accent)] text-[var(--color-inverse-text)] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg shadow-[var(--color-accent)]/20">
              <Home size={16} /> Return to Base
            </button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <button className="w-full flex items-center justify-center gap-3 py-4 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[var(--color-accent-soft)]/20 hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/50 transition-all group">
              <Sparkles size={16} className="text-[var(--color-accent)]" /> 
              Enter Hub <ArrowRight size={14} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
