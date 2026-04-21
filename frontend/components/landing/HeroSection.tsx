'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import Typewriter from '@/components/Typewriter'

export default function HeroSection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <section data-cursor-theme="light" className="min-h-[80vh] flex items-center overflow-hidden pt-12 md:pt-0 pb-12">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 w-full">
        <div className="grid md:grid-cols-12 gap-12 md:gap-8 items-center">
          {/* Left Column: Content */}
          <div className="md:col-span-5 z-10">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-[48px] md:text-[76px] leading-[0.95] tracking-[-0.05em] font-extrabold font-[var(--font-lp-serif)] text-transparent bg-clip-text bg-gradient-to-br from-[var(--lp-text)] via-[var(--lp-text)] to-[var(--lp-primary)] drop-shadow-[0_4px_4px_rgba(2,26,84,0.05)]">
                <Typewriter 
                  text="Collaboration refined for serious intent." 
                  speed={0.03} 
                  delay={0.2}
                />
              </h1>
              
              <Typewriter 
                text="We design memorable project intents that work as hard as your favorite team member. Oh, and the matching? Refreshingly smooth, some even say fun."
                delay={0.8}
                speed={0.01}
                className="mt-8 text-[18px] md:text-[20px] text-[var(--lp-text)] opacity-80 max-w-[480px] leading-relaxed font-[var(--font-lp-sans)]"
              />

              <motion.div 
                className="mt-10 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth?mode=register')}
                  className="group relative h-14 px-10 rounded-full bg-[var(--lp-primary)] text-white text-[11px] uppercase tracking-[0.2em] font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-lg shadow-[var(--lp-primary)]/20"
                >
                  <span className="relative z-10 font-[var(--font-lp-sans)]">Right this way</span>
                  <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
                  <div className="absolute inset-0 bg-black/10 transition-transform translate-y-full group-hover:translate-y-0 duration-300" />
                </button>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Image */}
          <div className="md:col-span-7 relative flex justify-end">
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[900px] aspect-[4/3] md:aspect-[1] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[var(--lp-bg)] rounded-[3rem] overflow-hidden flex items-center justify-center border border-[var(--lp-text)]/5">
                <img 
                  src="/collixa-hero.png" 
                  alt="Team collaborating" 
                  className="w-full h-full object-contain object-center transform transition-transform duration-[2rem] hover:scale-105"
                  loading="eager" // Hero image should load as soon as possible
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
