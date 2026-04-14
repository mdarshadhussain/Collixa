'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Typewriter from '@/components/Typewriter'

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
    btnLabel: "Reserve Access"
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
    btnLabel: "Match Now"
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
    btnLabel: "Start Building"
  }
];

export default function BenefitCardsSection() {
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
        <div className="overflow-x-auto pb-12 snap-x snap-mandatory no-scrollbar">
          <div className="flex gap-6 md:gap-10 min-w-max pr-16 md:pr-32">
            {BENEFITS_DATA.map((benefit, idx) => (
              <div 
                key={`${benefit.title}-${idx}`}
                className={`${benefit.bg} ${benefit.text} p-8 md:p-10 rounded-[2rem] flex flex-col min-h-[340px] w-[85vw] md:w-[600px] shrink-0 snap-center border border-black/5 shadow-xl shadow-transparent hover:shadow-black/5 transition-all duration-700`}
              >
                <div className="flex justify-between items-start mb-16">
                  <span className="text-[18px] opacity-80 font-medium font-sans">{benefit.number}</span>
                </div>

                <div className="flex-grow">
                  <Typewriter 
                    text={benefit.title}
                    className="text-[36px] md:text-[42px] leading-tight font-bold mb-8 tracking-tight font-sans"
                  />
                  
                  <Typewriter 
                    text={benefit.description}
                    speed={0.01}
                    className="text-[17px] md:text-[18px] opacity-90 leading-relaxed mb-6 font-sans"
                  />

                  <p className="text-[15px] italic opacity-80 mb-10 font-sans">
                    {benefit.idealFor}
                  </p>

                  <div className="pt-6 border-t border-current/20 mb-10 text-[var(--lp-text)]">
                    <div className="flex justify-between items-center opacity-80 cursor-pointer group/inside">
                      <span className="text-[14px] font-bold uppercase tracking-widest font-sans">What's inside</span>
                      <ChevronDown className="w-5 h-5 group-hover/inside:translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className={`flex items-center gap-3 px-8 py-4 rounded-full ${benefit.btnBg} ${benefit.btnText} font-bold text-[14px] transition-transform hover:scale-105 active:scale-95 font-sans`}>
                    {benefit.btnLabel}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
