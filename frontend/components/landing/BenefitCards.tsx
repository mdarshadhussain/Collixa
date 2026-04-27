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
    title: "Find Your People",
    description: "Whether it's for sports, hobbies, or building a business, Collixa connects you with partners who share your purpose. Stop searching and start collaborating with AI-matched peers.",
    idealFor: "Ideal for anyone looking for gym partners, players, or co-founders.",
    bg: "bg-[#FFCEE3]", // Soft Pink
    text: "text-[#021A54]",
    btnBg: "bg-[#021A54]",
    btnText: "text-white",
    btnLabel: "Post an Intent",
    insideItems: [
      "AI compatibility matching",
      "Broad category support (Sports/B2B)",
      "Instant synergy scores",
      "Goal-based messaging"
    ]
  },
  {
    number: "(02)",
    title: "Monetize Expertise",
    description: "Create a Tribe and share your skills. Set your own credit fee and get rewarded after every successful session. It’s the ultimate marketplace for disciplinary growth.",
    idealFor: "Perfect for mentors, coaches, and skill specialists.",
    bg: "bg-[#021A54]", // Midnight Blue
    text: "text-[#F5F5F5]",
    btnBg: "bg-[#F5F5F5]",
    btnText: "text-[#021A54]",
    btnLabel: "Create a Tribe",
    insideItems: [
      "Fixed-fee credit payouts",
      "Admin-approved quality control",
      "Secure escrow-like flow",
      "Scheduled meeting archives"
    ]
  },
  {
    number: "(03)",
    title: "Rise through Ranks",
    description: "Your engagement is rewarded. Level up to unlock better economic perks like purchase bonuses on credits and massive discounts on transfer fees.",
    idealFor: "Best for active community builders and long-term users.",
    bg: "bg-[#FFCEE3]", // Soft Pink
    text: "text-[#021A54]",
    btnBg: "bg-[#021A54]",
    btnText: "text-white",
    btnLabel: "Check Rewards",
    insideItems: [
      "Tiered purchase bonuses",
      "Discounted transfer fees",
      "Exclusive Oracle privileges",
      "Engagement-based leveling"
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
      <div className="max-w-[1550px] mx-auto px-[5%] md:px-[10%] mb-12 sm:mb-16 md:mb-20 text-left">
        <Typewriter 
          text="Designed for the detail-oriented team."
          className="text-[32px] sm:text-[40px] md:text-[56px] font-bold font-sans text-[#021A54] dark:text-white max-w-none leading-[1.1] tracking-tight block"
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
