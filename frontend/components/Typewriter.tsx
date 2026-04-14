'use client'

import { motion } from 'framer-motion'

interface TypewriterProps {
  text: string
  delay?: number
  speed?: number
  className?: string
  align?: 'left' | 'center' | 'right'
}

export default function Typewriter({ 
  text, 
  delay = 0, 
  speed = 0.03, 
  className = '',
  align = 'left'
}: TypewriterProps) {
  // Use a staggered container effect
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: speed, 
        delayChildren: delay 
      },
    },
  }

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25, // Snappier
        stiffness: 200,
      },
    },
    hidden: {
      opacity: 0,
      y: 5, // Reduced shift to minimize jitter
    },
  }

  // Split text into words
  const words = text.split(' ')

  const alignmentClass = align === 'center' ? 'justify-center text-center' : align === 'right' ? 'justify-end text-right' : 'justify-start text-left'

  return (
    <motion.span
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`inline-flex flex-wrap ${alignmentClass} ${className}`}
      style={{ lineHeight: 'inherit' }}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap" style={{ verticalAlign: 'baseline' }}>
          {Array.from(word).map((letter, letterIdx) => (
            <motion.span
              key={letterIdx}
              variants={child}
              style={{ display: 'inline-block', verticalAlign: 'baseline' }}
            >
              {letter}
            </motion.span>
          ))}
          {/* Add a space character that is also a motion span to ensure staggered timing for spaces */}
          <motion.span variants={child} style={{ display: 'inline-block', verticalAlign: 'baseline' }}>
            &nbsp;
          </motion.span>
        </span>
      ))}
    </motion.span>
  )
}
