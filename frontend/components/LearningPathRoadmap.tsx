'use client'

import React from 'react'
import { CheckCircle2, Circle, Clock, BookOpen, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  step: string
  description: string
  duration: string
  resources: string[]
}

interface LearningPathRoadmapProps {
  steps: Step[]
}

const LearningPathRoadmap: React.FC<LearningPathRoadmapProps> = ({ steps }) => {
  if (!steps || steps.length === 0) return null

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[var(--color-accent)] before:via-[var(--color-border)] before:to-transparent">
      {steps.map((step, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group select-none"
        >
          {/* Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-accent)] shadow-xl z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-inverse-text)]">
            {index === 0 ? <Sparkles size={16} /> : <Circle size={16} />}
          </div>

          {/* Card */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[var(--color-bg-secondary)] p-6 rounded-2xl md:rounded-[2rem] border border-[var(--color-border)] hover:border-[var(--color-accent)]/30 transition-all shadow-sm group-hover:shadow-2xl group-hover:shadow-[var(--color-accent)]/5">
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)]">Step 0{index + 1}</span>
               <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--color-bg-primary)] rounded-full text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                  <Clock size={10} /> {step.duration}
               </div>
            </div>
            
            <h4 className="text-xl font-serif font-black mb-2 text-[var(--color-text-primary)]">{step.step}</h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6 italic">"{step.description}"</p>
            
            <div className="space-y-3">
               <p className="text-[8px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40 flex items-center gap-2">
                  <BookOpen size={10} /> Research Topics
               </p>
               <div className="flex flex-wrap gap-2">
                  {step.resources.map((res, ridx) => (
                    <span key={ridx} className="px-3 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[9px] font-bold text-[var(--color-text-primary)]">
                       {res}
                    </span>
                  ))}
               </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default LearningPathRoadmap
