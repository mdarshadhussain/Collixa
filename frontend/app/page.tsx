'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useScroll, useTransform, useSpring, type Variants } from 'framer-motion'
import { ArrowRight, CheckCircle2, Compass, MessagesSquare, Sparkles, Users } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/app/context/AuthContext'

const heroHeadingVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

const heroSubtextVariant: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' },
  },
}

const heroCtaVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.4, ease: 'easeOut' },
  },
}

const revealUpVariant: Variants = {
  hidden: { opacity: 0, y: 50 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

const cardContainerVariant: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const cardItemVariant: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const stepContainerVariant: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const stepItemVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

function HeroSection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  return (
    <section className="min-h-[80vh] flex items-center overflow-hidden pt-12 md:pt-0 pb-12">
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
                Collaboration refined for serious intent.
              </h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="mt-8 text-[18px] md:text-[20px] text-[var(--lp-text)] opacity-80 max-w-[480px] leading-relaxed font-[var(--font-lp-sans)]">
                We design memorable project intents that work as hard as your favorite team member. Oh, and the matching? Refreshingly smooth, some even say fun.
              </motion.p>

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
              {/* This is the cutout image, blended with bg */}
              <div className="absolute inset-0 bg-[var(--lp-bg)] rounded-[3rem] overflow-hidden flex items-center justify-center">
                <img 
                  src="/collixa-hero.png" 
                  alt="Team collaborating" 
                  className="w-full h-full object-contain object-center transform transition-transform duration-[2rem] hover:scale-105"
                />
              </div>
              
              {/* Subtle accent blob */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[var(--lp-primary)] rounded-full blur-[80px] opacity-15 animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoTicker() {
  const items = [
    "300+ Active Intents",
    "Aligned Collaborators",
    "Skill Exchange",
    "Momentum Driven",
    "Execution Ready",
    "Intent-first",
  ]

  return (
    <section className="bg-[#FF85BB] py-8 overflow-hidden select-none relative group border-y border-white/10">
      {/* Side Masks for the Ticker */}
      <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#FF85BB] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#FF85BB] to-transparent z-10" />

      <div className="flex whitespace-nowrap animate-ticker relative z-0">
        {[...items, ...items, ...items, ...items].map((text, idx) => (
          <div key={`${text}-${idx}`} className="flex items-center gap-12 mx-12">
            <span className="text-[var(--lp-text)] text-[20px] md:text-[28px] font-normal tracking-wide [font-family:'Quintessential',cursive] whitespace-nowrap">
              {text}
            </span>
            <div className="w-2 h-2 rounded-full bg-[var(--lp-text)] opacity-20 shrink-0" />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
          width: fit-content;
        }
      `}</style>
    </section>
  )
}

function FeatureItem({ feature, idx }: { feature: any, idx: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  // Spring stabilization to fix flickering
  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 100, 
    damping: 30, 
    restDelta: 0.001 
  })

  // Entrance/Exit mapping
  const opacity = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95])
  
  // Slide from left/right (Reduced Offset for stability)
  const xOffset = idx % 2 === 0 ? -80 : 80
  const x = useTransform(smoothProgress, [0, 0.3, 0.7, 1], [xOffset, 0, 0, xOffset / 2])
  
  // Subtle rotation
  const rotate = useTransform(smoothProgress, [0, 0.2, 0.8, 1], [idx % 2 === 0 ? -2 : 2, 0, 0, idx % 2 === 0 ? 2 : -2])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, x, rotate }}
      className={`group flex flex-col ${idx % 2 !== 0 ? 'md:mt-64 items-end text-right' : 'items-start text-left'}`}
    >
      <div className="relative aspect-[4/3] w-full md:max-w-[520px] rounded-[1.5rem] overflow-hidden mb-10 bg-[#010d2b] shadow-2xl transition-all duration-700 group-hover:shadow-[var(--lp-primary)]/20">
        <motion.div 
          className="w-full h-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.8 }}
        >
          <img 
            src={feature.image} 
            alt={feature.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
      </div>

      <div className="space-y-4 max-w-[400px]">
        <div className="flex flex-col gap-1">
          <p className="text-[var(--lp-primary)] text-[12px] font-bold tracking-[0.2em] uppercase font-sans">
            {feature.category}
          </p>
          <h3 className="text-[var(--lp-bg)] text-2xl md:text-3xl font-bold font-[var(--font-lp-serif)] group-hover:translate-x-1 transition-transform duration-700">
            {feature.title}
          </h3>
        </div>
        <p className="text-[var(--lp-bg)] opacity-40 text-[16px] leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  )
}

function FeatureGrid() {
  const features = [
    {
      title: "Create your intent",
      category: "Foundation",
      image: "/features/create-intent.png",
      description: "Define your project goals with our intuitive AI-assisted builder."
    },
    {
      title: "Join others",
      category: "Collaboration",
      image: "/features/join-others.png",
      description: "Find perfectly aligned projects looking for your unique skill set."
    },
    {
      title: "Real-time Messaging",
      category: "Communication",
      image: "/features/messaging.png",
      description: "Seamless coordination with built-in editorial-grade chat."
    },
    {
      title: "Get notified",
      category: "Automation",
      image: "/features/get-notified.png",
      description: "Never miss a match with intelligent, instant alerts."
    },
    {
      title: "Exclusive Tribes",
      category: "Community",
      image: "/features/tribes.png",
      description: "Join niche communities of professionals driving impact."
    },
    {
      title: "Skill Exchange",
      category: "Growth",
      image: "/features/skill-exchange.png",
      description: "Swap expertise and grow your portfolio through collaborative tasks."
    }
  ]

  return (
    <section id="features" className="bg-[var(--lp-text)] py-32 px-16 md:px-32 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <p className="text-[var(--lp-bg)] opacity-60 text-[13px] font-bold tracking-[0.2em] uppercase mb-6 font-sans">
              Features & Capabilities
            </p>
            <h2 className="text-[var(--lp-bg)] text-[48px] md:text-[64px] leading-[1] font-bold font-[var(--font-lp-serif)]">
              Built for intent, ready for whatever is next.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden md:block"
          >
            <p className="text-[var(--lp-bg)] opacity-60 text-[16px] max-w-[300px] leading-relaxed italic">
              Come on in and meet a few of the remarkable ways we help you build.
            </p>
          </motion.div>
        </div>

        {/* 2x3 Grid (Scroll-Linked + Super Tight Gaps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-48 items-start">
          {features.map((feature, idx) => (
            <FeatureItem key={feature.title} feature={feature} idx={idx} />
          ))}
        </div>
      </div>

      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--lp-primary)] rounded-full blur-[200px] opacity-[0.03] -translate-y-1/2 translate-x-1/2" />
    </section>
  )
}

function BenefitsTicker() {
  const benefits = [
    {
      title: "Seamless Collaboration",
      image: "/benefits/collab.png",
      tag: "Workflow"
    },
    {
      title: "Dynamic Skill Matching",
      image: "/benefits/match.png",
      tag: "AI Engine"
    },
    {
      title: "Vibrant Community",
      image: "/benefits/community.png",
      tag: "Ecosystem"
    },
    {
      title: "Real-time Momentum",
      image: "/benefits/momentum.png",
      tag: "Execution"
    },
    {
      title: "Intent Architect",
      image: "/benefits/architect.png",
      tag: "Strategy"
    },
    {
      title: "Expert Network",
      image: "/benefits/expert.png",
      tag: "Resources"
    }
  ]

  // Repeat for infinite effect
  const displayBenefits = [...benefits, ...benefits]

  return (
    <section id="benefits" className="py-24 bg-[var(--lp-bg)] overflow-hidden border-y border-[var(--lp-text)]/5">
      <div className="max-w-[1400px] mx-auto px-6 mb-16">
        <h2 className="text-[13px] font-bold tracking-[0.2em] uppercase text-[var(--lp-primary)] mb-4 font-sans">
          Proven Impact
        </h2>
        <p className="text-[32px] md:text-[40px] font-bold font-[var(--font-lp-serif)] text-[var(--lp-text)] max-w-xl leading-[1.1]">
          Designed for the detail-oriented team.
        </p>
      </div>

      <div className="relative group">
        <div className="flex animate-scroll hover:[animation-play-state:paused] cursor-pointer">
          {displayBenefits.map((benefit, idx) => (
            <div 
              key={`${benefit.title}-${idx}`} 
              className="px-6 shrink-0"
            >
              <div className="w-[80vw] md:w-[450px] space-y-8">
                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden border border-[var(--lp-text)]/10 shadow-lg bg-white/50">
                  <img 
                    src={benefit.image} 
                    alt={benefit.title} 
                    className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105" 
                  />
                </div>
                <div className="px-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--lp-primary)] mb-2 block font-sans">
                    {benefit.tag}
                  </span>
                  <h3 className="text-2xl font-bold font-[var(--font-lp-serif)] text-[var(--lp-text)]">
                    {benefit.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
          width: fit-content;
          display: flex;
        }
      `}</style>
    </section>
  )
}

function ValueStatementSection() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.7"]
  })

  // Smooth entrance earlier in the scroll
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1])
  const scale = useTransform(scrollYProgress, [0, 0.4], [0.95, 1])

  return (
    <section ref={ref} className="pt-24 pb-12 md:pt-32 md:pb-16 border-t border-[var(--lp-text)]/10">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <motion.div
          style={{ opacity, scale }}
          className="max-w-[700px] mx-auto text-center"
        >
          <h2 className="text-[40px] md:text-[56px] leading-[1.1] tracking-[-0.02em] font-bold font-[var(--font-lp-serif)] text-[var(--lp-text)]">
            A focused marketplace for serious collaboration.
          </h2>
          <p className="mt-6 text-[18px] text-[var(--lp-text)] opacity-70 font-[var(--font-lp-sans)]">
            Skip scattered tools and generic networking. Collixa keeps intent, matching, and execution in one clear workflow.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCardItem({ card, idx }: { card: any, idx: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"]
  })

  // Entrance mapping
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1])
  const y = useTransform(scrollYProgress, [0, 0.5], [50, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.95, 1])

  return (
    <motion.article
      ref={ref}
      style={{ opacity, y, scale }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="p-8 rounded-[2rem] border border-[var(--lp-text)]/20 bg-[var(--lp-primary)]/10 backdrop-blur-sm shadow-lg shadow-transparent hover:shadow-[var(--lp-text)]/5 transition-shadow duration-500"
    >
      <card.icon className="w-6 h-6 mb-6 text-[var(--lp-primary)]" />
      <h3 className="font-[var(--font-lp-serif)] text-2xl leading-tight font-bold text-[var(--lp-text)]">{card.title}</h3>
      <p className="mt-4 text-[var(--lp-text)] opacity-80 text-[15px] leading-relaxed font-[var(--font-lp-sans)]">{card.text}</p>
    </motion.article>
  )
}

function FeatureCardsSection() {
  const cards = [
    {
      icon: Compass,
      title: 'Intent-first discovery',
      text: 'Surface collaborators based on project goals, not noisy feeds.',
    },
    {
      icon: Users,
      title: 'Aligned collaborator matching',
      text: 'Find people whose skills and availability match your current stage.',
    },
    {
      icon: MessagesSquare,
      title: 'Execution-ready messaging',
      text: 'Move from intro to delivery with structured conversations and requests.',
    },
  ]

  return (
    <section className="pt-4 pb-12 bg-[var(--lp-bg)]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <FeatureCardItem key={card.title} card={card} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

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
      <span className="absolute top-10 right-10 text-[64px] font-[var(--font-lp-serif)] text-[var(--lp-text)] opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-700 select-none">
        {step.number}
      </span>

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-[var(--lp-primary)]/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
          <step.icon className="w-6 h-6 text-[var(--lp-primary)]" />
        </div>
        
        <h3 className="font-bold text-2xl md:text-3xl font-[var(--font-lp-serif)] text-[var(--lp-text)] mb-4">
          {step.title}
        </h3>
        <p className="text-[var(--lp-text)] opacity-90 text-[16px] leading-relaxed font-[var(--font-lp-sans)]">
          {step.description}
        </p>
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-[var(--lp-primary)] transition-all duration-500 group-hover:w-[40%] rounded-t-full opacity-50" />
    </motion.div>
  )
}

function HowItWorksSection() {
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
    <section id="process" className="pt-4 pb-24 md:pb-32 bg-[var(--lp-bg)] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[var(--lp-primary)] text-[12px] font-bold tracking-[0.3em] uppercase mb-4"
          >
            The Momentum Engine
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-[var(--font-lp-serif)] text-[48px] md:text-[64px] leading-tight font-bold text-[var(--lp-text)]"
          >
            How it works
          </motion.h2>
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

function FinalCTASection() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-[760px] mx-auto"
        >
          <h2 className="font-[var(--font-lp-serif)] text-[44px] md:text-[72px] leading-[0.95] tracking-tight font-bold text-[var(--lp-text)]">
            Ready to build your next project with the right people?
          </h2>

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

export default function LandingPage() {
  return (
    <div className="landing-page-scope min-h-screen bg-[var(--lp-bg)] text-[var(--lp-text)]">
      <Header />
      <HeroSection />
      <div className="h-20" /> {/* Shift ticker down */}
      <LogoTicker />
      <FeatureGrid />
      <div className="space-y-0">
        <BenefitsTicker />
        <ValueStatementSection />
        <FeatureCardsSection />
        <HowItWorksSection />
        <LogoTicker />
        <FinalCTASection />
      </div>
    </div>
  )
}
