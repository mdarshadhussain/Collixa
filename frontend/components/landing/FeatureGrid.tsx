'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import Typewriter from '@/components/Typewriter'

function FeatureItem({ feature, idx }: { feature: any, idx: number }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  })

  const smoothProgress = useSpring(scrollYProgress, { 
    stiffness: 160, 
    damping: 40,
    mass: 0.6,
    restDelta: 0.001 
  })

  const opacity = useTransform(smoothProgress, [0.1, 0.4], [0, 1])
  const scale = useTransform(smoothProgress, [0.1, 0.4], [0.85, 1])
  const x = useTransform(smoothProgress, [0.1, 0.4], [idx % 2 === 0 ? -180 : 180, 0])
  const rotate = useTransform(smoothProgress, [0.1, 0.4], [idx % 2 === 0 ? -15 : 15, 0])

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, x, rotate }}
      className={`group flex flex-col ${idx % 2 !== 0 ? 'md:mt-64 items-end text-right md:pr-8' : 'items-start text-left md:pl-4'}`}
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
            loading="lazy"
          />
        </motion.div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
      </div>

      <div className="space-y-4 max-w-[400px]">
        <div className="flex flex-col gap-1">
          <Typewriter 
            text={feature.category}
            align={idx % 2 !== 0 ? 'right' : 'left'}
            className="text-[var(--lp-primary)] text-[12px] font-bold tracking-[0.2em] uppercase font-sans"
          />
          <Typewriter 
            text={feature.title}
            align={idx % 2 !== 0 ? 'right' : 'left'}
            className="text-[var(--lp-bg)] text-2xl md:text-3xl font-bold font-[var(--font-lp-serif)] group-hover:translate-x-1 transition-transform duration-700"
          />
        </div>
        <Typewriter 
          text={feature.description}
          align={idx % 2 !== 0 ? 'right' : 'left'}
          speed={0.01}
          className="text-[var(--lp-bg)] opacity-40 text-[16px] leading-relaxed"
        />
      </div>
    </motion.div>
  )
}

export default function FeatureGrid() {
  const features = [
    {
      title: "Declare Your Intent",
      category: "Connections",
      image: "/features/intent.png",
      description: "Looking for a badminton partner or a startup team? Post your intent and let AI find exactly who you need."
    },
    {
      title: "Join Skill Tribes",
      category: "Education",
      image: "/features/tribe.png",
      description: "Enter niche communities where experts share skills. Apply to join, learn from the best, and level up."
    },
    {
      title: "Earn with Credits",
      category: "Economy",
      image: "/features/economy.png",
      description: "Teach what you know and get paid in credits. Fixed fees ensure you are rewarded for your expertise."
    },
    {
      title: "Wealth Protocol",
      category: "Rewards",
      image: "/features/protocol.png",
      description: "Rise from Nomad to Oracle. Higher levels unlock bigger purchase bonuses and lower transfer fees."
    },
    {
      title: "AI Compatibility",
      category: "Intelligence",
      image: "/features/ai.png",
      description: "Gemini AI analyzes your profile to suggest the most relevant users, tribes, and intents for your goals."
    },
    {
      title: "Goal Roadmaps",
      category: "Guidance",
      image: "/features/roadmap.png",
      description: "Get AI-generated outlines and roadmaps for your specific purpose, keeping you on the path to success."
    }
  ]

  return (
    <section id="features" data-cursor-theme="dark" className="bg-[var(--lp-text)] py-32 px-16 md:px-32 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-24">
          <div className="max-w-2xl">
            <Typewriter 
              text="Features & Capabilities"
              className="text-[var(--lp-bg)] opacity-60 text-[13px] font-bold tracking-[0.2em] uppercase mb-6 font-sans"
            />
            <Typewriter 
              text="Built for intent, ready for whatever is next."
              className="text-[var(--lp-bg)] text-[48px] md:text-[64px] leading-[1] font-bold font-[var(--font-lp-serif)]"
            />
          </div>
          <div className="hidden md:block">
            <Typewriter 
              text="Come on in and meet a few of the remarkable ways we help you build."
              align="right"
              speed={0.01}
              className="text-[var(--lp-bg)] opacity-60 text-[16px] max-w-[300px] leading-relaxed italic"
            />
          </div>
        </div>

        {/* 2x3 Grid */}
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
