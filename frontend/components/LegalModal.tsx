'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, Lock, FileText, Scale, Eye } from 'lucide-react'
import { useState } from 'react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
}

const sections = [
  { id: 'data', title: 'Data & Intent', icon: Eye, content: 'At Collixa, we prioritize transparency. We collect information related to your professional identity, project intents, and collaboration history primarily to power our alignment engine. This data helps us match you with the most compatible partners for your specific execution needs.' },
  { id: 'ip', title: 'Intellectuals', icon: Shield, content: 'Your projects remain yours. While Collixa provides the ecosystem for connection and momentum, we do not claim ownership over any original ideas, project blueprints, or intellectual assets shared within your private intents unless explicitly stated in a specific partnership agreement.' },
  { id: 'trust', title: 'Trust & Safety', icon: Lock, content: 'Collaboration is built on trust. Our platform utilizes validated skills and peer-reviewed momentum scores to ensure a safe environment for high-stakes building. We reserve the right to remove accounts that violate our community standards or jeopardize the momentum of others.' },
  { id: 'privacy', title: 'Privacy Guarantee', icon: FileText, content: 'We do not sell your personal data to third parties. Our business model is centered on the success of your project alignment, not the monetization of your private correspondence. Communications within the Collixa platform are secured to protect your strategic advantages.' },
  { id: 'terms', title: 'Modifications', icon: Scale, content: 'Collixa is an evolving ecosystem. We may update these terms as our platform introduces new collaboration tools and trust mechanisms. Continued use of the platform after updates constitutes acceptance of the refined momentum protocols.' },
]

export default function LegalModal({ isOpen, onClose }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState('data')

  const scrollToSection = (id: string) => {
    setActiveTab(id)
    const element = document.getElementById(`section-${id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] cursor-pointer"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4 md:p-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="bg-[#F5F5F0] w-full max-w-[1100px] h-[85vh] md:h-[700px] rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col md:flex-row relative border border-white/20"
            >
              {/* Sidebar (Navigation) - Hidden on very small screens */}
              <div className="hidden md:flex w-[280px] bg-white/40 backdrop-blur-xl border-r border-black/5 flex-col p-8">
                <div className="mb-12">
                  <div className="w-10 h-10 bg-[#FF85BB] rounded-xl mb-4 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-[28px] font-black font-[var(--font-lp-serif)] text-[#021A54] leading-none">
                    Legal<br />Center
                  </h2>
                </div>

                <nav className="flex-1 space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${activeTab === section.id
                        ? 'bg-[#021A54] text-white shadow-lg shadow-[#021A54]/20'
                        : 'hover:bg-black/5 text-[#021A54]/60 hover:text-[#021A54]'
                        }`}
                    >
                      <section.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === section.id ? 'text-[#FF85BB]' : ''}`} />
                      <span className="text-[13px] font-bold uppercase tracking-wider">{section.title}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-8 pt-6 border-t border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#021A54]/30">
                    Collixa.❤️ Made with Intent
                  </p>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col h-full overflow-hidden bg-white/20">
                {/* Header (Sticky-ish) */}
                <div className="p-8 md:px-12 md:py-8 flex justify-between items-center bg-[#F5F5F0]/80 backdrop-blur-md z-10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF85BB] mb-1 block">Governance</span>
                    <h3 className="text-3xl font-bold font-[var(--font-lp-serif)] text-[#021A54]">Privacy & Terms</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-[#021A54]/5 flex items-center justify-center hover:bg-[#021A54]/10 transition-colors group"
                  >
                    <X className="w-6 h-6 text-[#021A54] group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-32 custom-scrollbar scroll-smooth">
                  <div className="max-w-[600px] space-y-20 pt-10">
                    {sections.map((section, idx) => (
                      <motion.section
                        key={section.id}
                        id={`section-${section.id}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                      >
                        <div className="absolute -left-4 md:-left-8 top-0 bottom-0 w-[2px] bg-[#FF85BB]/10" />
                        <span className="text-[48px] font-black italic text-[#FF85BB]/10 absolute -top-10 -left-6 md:-left-12 select-none">
                          0{idx + 1}
                        </span>
                        <h4 className="text-2xl font-bold font-[var(--font-lp-serif)] text-[#021A54] mb-6 flex items-center gap-3">
                          {section.title}
                          <div className="h-[1px] flex-1 bg-[#021A54]/10" />
                        </h4>
                        <p className="text-[17px] leading-relaxed text-[#021A54]/70 font-[var(--font-lp-sans)]">
                          {section.content}
                        </p>
                      </motion.section>
                    ))}

                    <div className="pt-12 border-t border-black/5 opacity-40 text-[12px] font-bold tracking-widest uppercase">
                      Last updated: April 30, 2026. Ref: CLXA-M-01
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="absolute bottom-0 right-0 left-0 md:left-[280px] p-8 md:px-12 bg-gradient-to-t from-[#F5F5F0] via-[#F5F5F0]/95 to-transparent pointer-events-none flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-12 py-5 bg-[#021A54] text-white rounded-full font-bold text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-[#021A54]/40 hover:scale-105 active:scale-95 transition-all pointer-events-auto flex items-center gap-3 group"
                  >
                    Confirm & Accept
                    <X className="w-4 h-4 group-hover:opacity-100 opacity-50 transition-opacity" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(2, 26, 84, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(2, 26, 84, 0.2);
        }
      `}</style>
    </AnimatePresence>
  )
}
