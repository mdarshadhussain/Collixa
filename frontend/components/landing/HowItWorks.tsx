'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CheckCircle2, Sparkles, Users } from 'lucide-react'
import Typewriter from '@/components/Typewriter'

function HowItWorksStepItem({ step, idx }: { step: any, idx: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.98", "start 0.7"]
  })

  // Smooth entrance earlier in the scroll
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1])
  const scale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1])
  const y = useTransform(scrollYProgress, [0, 0.4], [40, 0])

  return (
    <motion.div 
      ref={ref}
      style={{ opacity, scale, y }}
      whileHover={{ y: -10 }}
      className="group relative p-10 md:p-12 rounded-[2.5rem] border border-[var(--lp-text)]/10 bg-[var(--lp-primary)]/[0.03] backdrop-blur-sm transition-all duration-500 hover:bg-[var(--lp-primary)]/[0.06] hover:border-[var(--lp-primary)]/20 shadow-xl shadow-transparent hover:shadow-[var(--lp-primary)]/5"
    >
      {/* Step Number */}
      <span className="absolute top-10 right-10 text-[64px] font-black font-sans text-[#FF85BB] opacity-[0.2] group-hover:opacity-[0.4] transition-opacity duration-700 select-none">
        {step.number}
      </span>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--lp-primary)]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
          <step.icon className="w-6 h-6 text-[var(--lp-primary)]" />
        </div>
        
        <Typewriter 
          text={step.title}
          align="center"
          className="font-bold text-2xl md:text-3xl font-[var(--font-lp-serif)] text-[var(--lp-text)] mb-4"
        />
        <Typewriter 
          text={step.description}
          align="center"
          speed={0.01}
          className="text-[var(--lp-text)] opacity-90 text-[16px] leading-relaxed font-[var(--font-lp-sans)]"
        />
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[var(--lp-primary)] transition-all duration-500 group-hover:w-[40%] rounded-t-full opacity-50" />
    </motion.div>
  )
}

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Sparkles,
      title: 'Define Intent',
      description: 'Start with a clear goal. What do you want to build or achieve next?'
    },
    {
      number: "02",
      icon: Users,
      title: 'Meet Matches',
      description: 'Our engine identifies collaborators with the exact DNA your project needs.'
    },
    {
      number: "03",
      icon: CheckCircle2,
      title: 'Gain Momentum',
      description: 'Launch into collaborative action with purpose-built tools for delivery.'
    },
  ]

  return (
    <section id="process" data-cursor-theme="light" className="pt-4 pb-24 md:pb-32 bg-[var(--lp-bg)] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-20 flex flex-col items-center">
          <Typewriter 
            text="The Momentum Engine"
            align="center"
            className="text-[var(--lp-primary)] text-[12px] font-bold tracking-[0.3em] uppercase mb-4 font-sans"
          />
          <Typewriter 
            text="How it works"
            align="center"
            className="font-[var(--font-lp-serif)] text-[48px] md:text-[64px] leading-tight font-bold text-[var(--lp-text)]"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <HowItWorksStepItem key={step.title} step={step} idx={idx} />
          ))}
        </div>
      </div>

      {/* Decorative Blob */}
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-[var(--lp-text)]/[0.03] to-transparent pointer-events-none" />
    </section>
  )
}
