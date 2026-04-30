'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function Splash({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 1000) // Wait for exit animation
    }, 2500)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F5F5F0] overflow-hidden"
        >
          {/* Animated Background Elements */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute w-[500px] h-[500px] rounded-full bg-[#FF85BB] blur-[120px]"
          />
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 0.8, opacity: 0.05 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
            className="absolute w-[400px] h-[400px] rounded-full bg-[#021A54] blur-[100px] top-1/4 left-1/4"
          />

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-4"
            >
              <motion.span 
                className="text-6xl md:text-8xl font-black tracking-[-0.05em] font-['Nunito'] text-[#021A54]"
                initial={{ letterSpacing: '0.2em', opacity: 0 }}
                animate={{ letterSpacing: '-0.05em', opacity: 1 }}
                transition={{ duration: 1.2, ease: "circOut" }}
              >
                Collixa.
              </motion.span>
              
              <div className="h-[2px] w-0 bg-[#FF85BB] rounded-full" />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
                className="h-[2px] bg-[#FF85BB] rounded-full"
              />
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="text-[10px] uppercase font-black tracking-[0.4em] text-[#021A54]"
              >
                Find your purpose.
              </motion.p>
            </motion.div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.2 }}
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-[#FF85BB]"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
