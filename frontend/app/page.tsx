'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import CustomCursor from '@/components/CustomCursor'
import LegalModal from '@/components/LegalModal'

// Lazy load sections below the fold
const HeroSection = dynamic(() => import('@/components/landing/HeroSection'), {
  ssr: true, // Keep hero SSR-friendly for SEO
})

const LogoTicker = dynamic(() => import('@/components/landing/LogoTicker'), {
  ssr: true,
})

const FeatureGrid = dynamic(() => import('@/components/landing/FeatureGrid'), {
  ssr: false, // Performance: Load features on client
})

const BenefitCardsSection = dynamic(() => import('@/components/landing/BenefitCards'), {
  ssr: false,
})

const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorks'), {
  ssr: false,
})

const FinalCTASection = dynamic(() => import('@/components/landing/FinalCTA'), {
  ssr: false,
})

export default function LandingPage() {
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false)

  return (
    <div className="landing-page-scope min-h-screen bg-[var(--lp-bg)] text-[var(--lp-text)] cursor-none pt-20">
      <CustomCursor />
      <Header />
      <HeroSection />
      <div className="h-20" /> {/* Shift ticker down */}
      <LogoTicker />
      <FeatureGrid />
      <div className="space-y-0">
        <BenefitCardsSection />
        <HowItWorksSection />
        <LogoTicker items={[
          "\"Connections built on purpose.\"",
          "\"Find your game. Find your team.\"",
          "\"Skills shared. Rewards earned.\"",
          "\"Level up your community.\"",
          "\"Your growth is our protocol.\""
        ]} />
        <FinalCTASection />
      </div>
      <Footer onLegalClick={() => setIsLegalModalOpen(true)} />
      <ScrollToTop />
      
      <LegalModal 
        isOpen={isLegalModalOpen} 
        onClose={() => setIsLegalModalOpen(false)} 
      />
    </div>
  )
}
