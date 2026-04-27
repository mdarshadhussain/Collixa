'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import Typewriter from '@/components/Typewriter'

export default function FinalCTASection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section data-cursor-theme="light" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-[760px] mx-auto flex flex-col items-center"
        >
          <Typewriter 
            text="Ready to find your next partner and join the community?"
            align="center"
            className="font-[var(--font-lp-serif)] text-[44px] md:text-[72px] leading-[0.95] tracking-tight font-bold text-[var(--lp-text)]"
          />

          <motion.button
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.2 }}
            onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth?mode=register')}
            className="mt-12 h-14 px-10 rounded-full bg-[var(--lp-text)] text-[var(--lp-bg)] text-[11px] uppercase tracking-[0.2em] font-bold inline-flex items-center gap-2 shadow-xl shadow-black/10"
          >
            Create your intent <ArrowRight size={16} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
