'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import CustomCursor from '@/components/CustomCursor'
import LegalModal from '@/components/LegalModal'

import HeroSection from '@/components/landing/HeroSection'
import LogoTicker from '@/components/landing/LogoTicker'
import FeatureGrid from '@/components/landing/FeatureGrid'
import BenefitCardsSection from '@/components/landing/BenefitCards'
import HowItWorksSection from '@/components/landing/HowItWorks'
import FinalCTASection from '@/components/landing/FinalCTA'

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
