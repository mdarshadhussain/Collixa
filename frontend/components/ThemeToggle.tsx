'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || pathname === '/' || pathname?.startsWith('/auth')) {
    if (pathname === '/' || pathname?.startsWith('/auth')) return null;
    return <div className="w-14 h-8 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] opacity-50" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setTheme(isDark ? 'light' : 'dark');
      }}
      className="relative flex items-center w-12 h-7 p-1 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all overflow-hidden shrink-0"
      aria-label="Toggle Dark Mode"
    >
      {/* Background celestial bodies */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0 }}
      />
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-amber-200/20 to-orange-400/20"
        initial={false}
        animate={{ opacity: isDark ? 0 : 1 }}
      />

      {/* The sliding toggle */}
      <motion.div
        className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-md"
        initial={false}
        animate={{
          x: isDark ? 20 : 0,
          rotate: isDark ? 360 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isDark ? <Moon size={10} fill="currentColor" /> : <Sun size={10} fill="currentColor" />}
      </motion.div>
    </button>
  )
}
