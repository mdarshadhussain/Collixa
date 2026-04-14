'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light')

  // Use motion values for better performance
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Use spring for a "liquid" lag effect
  const springConfig = { damping: 25, stiffness: 200 }
  const mainX = useSpring(mouseX, springConfig)
  const mainY = useSpring(mouseY, springConfig)

  // Secondary cursor with even more lag
  const trailX = useSpring(mouseX, { damping: 40, stiffness: 150 })
  const trailY = useSpring(mouseY, { damping: 40, stiffness: 150 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
      if (!isVisible) setIsVisible(true)

      // Detect theme of the section under the cursor
      const target = e.target as HTMLElement
      const themedParent = target.closest('[data-cursor-theme]') as HTMLElement
      if (themedParent) {
        const theme = themedParent.getAttribute('data-cursor-theme') as 'light' | 'dark'
        if (theme !== activeTheme) {
          setActiveTheme(theme)
        }
      }
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.hasAttribute('data-hover')
      ) {
        setIsHovered(true)
      } else {
        setIsHovered(false)
      }
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseover', handleMouseOver)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [mouseX, mouseY, isVisible, activeTheme])

  if (!isVisible) return null

  // Mapping: Dark BG -> Pink (#FF85BB), Light BG -> Dark Blue (#021A54)
  const primaryColor = activeTheme === 'dark' ? '#FF85BB' : '#021A54'

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Outer Ring / Trail */}
      <motion.div
        style={{
          x: trailX,
          y: trailY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          opacity: isHovered ? 0.3 : 0.4,
          borderColor: isHovered ? '#FF85BB' : primaryColor,
        }}
        className="fixed top-0 left-0 w-8 h-8 rounded-full border transition-colors duration-300"
      />

      {/* Main Dot */}
      <motion.div
        style={{
          x: mainX,
          y: mainY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovered ? 2 : 1,
          backgroundColor: isHovered ? '#FF85BB' : primaryColor,
        }}
        className="fixed top-0 left-0 w-2 h-2 rounded-full transition-colors duration-300"
      />
    </div>
  )
}
