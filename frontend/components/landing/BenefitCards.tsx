'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import Typewriter from '@/components/Typewriter'
import { useAuth } from '@/app/context/AuthContext'

const BENEFITS_DATA = [
  {
    number: "(01)",
    title: "Momentum Forge",
    description: "Designed for high-velocity teams who need immediate clarity. You'll finally have a collaboration workspace that feels intuitive, supports your project's specific DNA, and drives execution without the noise.",
    idealFor: "Ideal for project leads, founders, and technical architects.",
    bg: "bg-[#FFCEE3]", // Soft Pink
    text: "text-[#021A54]",
    btnBg: "bg-[#021A54]",
    btnText: "text-white",
    btnLabel: "Reserve Access",
    insideItems: [
      "Real-time clarity dashboards",
      "DNA-based workspace configuration",
      "Noise cancellation workflow tools",
      "Fast-track project execution"
    ]
  },
  {
    number: "(02)",
    title: "Intent Alignment",
    description: "Fully custom and strategically designed to see your big vision through. Our matching engine identifies collaborators you can count on — it's time your project's expert network caught up.",
    idealFor: "Perfect for established networks or growing service-based tribes.",
    bg: "bg-[#021A54]", // Midnight Blue
    text: "text-[#F5F5F5]",
    btnBg: "bg-[#F5F5F5]",
    btnText: "text-[#021A54]",
    btnLabel: "Match Now",
    insideItems: [
      "Strategic alignment matching engine",
      "Verified expert network access",
      "Vision-to-execution mapping",
      "Network integrity verification"
    ]
  },
  {
    number: "(03)",
    title: "Execution Vault",
    description: "A strategic ecosystem that protects your project's momentum. Move from intro to delivery with structured conversations, validated skills, and alignment that stays consistent.",
    idealFor: "Best for serious collaborators and long-term project partners.",
    bg: "bg-[#FFCEE3]", // Soft Pink
    text: "text-[#021A54]",
    btnBg: "bg-[#021A54]",
    btnText: "text-white",
    btnLabel: "Start Building",
    insideItems: [
      "Structured high-intent conversations",
      "Validated skill/momentum matrix",
      "Consistency guardrails",
      "Secure project delivery vault"
    ]
  }
];

function BenefitCardItem({ benefit, idx }: { benefit: any, idx: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleAction = () => {
    router.push(isAuthenticated ? '/dashboard' : '/auth?mode=register');
  };

  return (
    <motion.div 
      key={`${benefit.title}-${idx}`}
      layout
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`${benefit.bg} ${benefit.text} p-8 md:p-10 rounded-[2rem] flex flex-col w-[85vw] md:w-[600px] shrink-0 snap-center border border-black/5 shadow-xl shadow-transparent hover:shadow-black/5 transition-all duration-700 overflow-hidden md:min-h-[620px]`}
    >
      <div className="flex justify-between items-start mb-16 shrink-0">
        <span className="text-[18px] opacity-80 font-medium font-sans">{benefit.number}</span>
      </div>

      <div className="flex-grow flex flex-col">
        <div className="mb-8 shrink-0">
          <Typewriter 
            text={benefit.title}
            className="text-[36px] md:text-[42px] leading-tight font-bold tracking-tight font-sans"
          />
        </div>
        
        <div className="flex-grow">
          <Typewriter 
            text={benefit.description}
            speed={0.01}
            className="text-[17px] md:text-[18px] opacity-90 leading-relaxed mb-6 font-sans block min-h-[140px]"
          />

          <p className="text-[15px] italic opacity-80 mb-10 font-sans">
            {benefit.idealFor}
          </p>
        </div>

        <div className="pt-6 border-t border-current/20 mb-8">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex justify-between items-center opacity-80 cursor-pointer group/inside hover:opacity-100 transition-opacity"
          >
            <span className="text-[14px] font-bold uppercase tracking-widest font-sans">What's inside</span>
            <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
          
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <ul className="pt-6 space-y-3">
                  {benefit.insideItems.map((item: string, itemIdx: number) => (
                    <motion.li 
                      key={itemIdx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: itemIdx * 0.1 }}
                      className="text-[15px] flex items-center gap-3 opacity-90 font-sans"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 shrink-0">
        <button 
          onClick={handleAction}
          className={`flex items-center gap-3 px-8 py-4 rounded-full ${benefit.btnBg} ${benefit.btnText} font-bold text-[14px] transition-transform hover:scale-105 active:scale-95 font-sans`}
        >
          {benefit.btnLabel}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function BenefitCardsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return

    el.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 768 ? window.innerWidth * 0.85 : 640;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth : cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="benefits" data-cursor-theme="light" className="py-24 md:py-32 bg-[var(--lp-bg)]">
      <div className="max-w-[1550px] mx-auto px-[5%] md:px-[10%] mb-16">
        <Typewriter 
          text="Proven Impact"
          className="text-[13px] font-bold tracking-[0.2em] uppercase text-[#FF85BB] mb-4 font-sans"
        />
        <Typewriter 
          text="Designed for the detail-oriented team."
          className="text-[40px] md:text-[56px] font-bold font-sans text-[#021A54] dark:text-white max-w-2xl leading-[1.05] tracking-tight"
        />
      </div>

      <div className="ml-[5%] md:ml-[10%] overflow-hidden">
        <div 
          ref={scrollRef}
          className="overflow-x-auto pb-12 snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          <div className="flex items-start gap-6 md:gap-10 min-w-max pr-16 md:pr-32">
            {BENEFITS_DATA.map((benefit, idx) => (
              <BenefitCardItem key={`${benefit.title}-${idx}`} benefit={benefit} idx={idx} />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-2 md:mt-4 mr-[5%] md:mr-[10%]">
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 md:p-2.5 rounded-full border border-[#021A54]/20 flex items-center justify-center transition-all duration-500 ${!canScrollLeft ? 'opacity-20 cursor-not-allowed' : 'bg-white hover:bg-[#021A54] hover:text-white cursor-pointer hover:border-[#021A54] shadow-sm hover:shadow-lg hover:scale-110 active:scale-95'}`}
            aria-label="Scroll Left"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 md:p-2.5 rounded-full border border-[#021A54]/20 flex items-center justify-center transition-all duration-500 ${!canScrollRight ? 'opacity-20 cursor-not-allowed' : 'bg-white hover:bg-[#021A54] hover:text-white cursor-pointer hover:border-[#021A54] shadow-sm hover:shadow-lg hover:scale-110 active:scale-95'}`}
            aria-label="Scroll Right"
          >
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
