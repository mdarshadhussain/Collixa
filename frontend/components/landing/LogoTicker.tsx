'use client'

export default function LogoTicker({ items }: { items?: string[] }) {
  const defaultItems = [
    "300+ Active Intents",
    "Aligned Collaborators",
    "Skill Exchange",
    "Momentum Driven",
    "Execution Ready",
    "Intent-first",
  ]

  const displayItems = items || defaultItems

  return (
    <section data-cursor-theme="light" className="bg-[#FF85BB] py-8 overflow-hidden select-none relative group border-y border-white/10">
      {/* Side Masks for the Ticker */}
      <div className="absolute inset-y-0 left-0 w-32 md:w-64 bg-gradient-to-r from-[#FF85BB] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-32 md:w-64 bg-gradient-to-l from-[#FF85BB] to-transparent z-10" />

      <div className="flex whitespace-nowrap animate-ticker relative z-0">
        {[...displayItems, ...displayItems, ...displayItems, ...displayItems].map((text, idx) => (
          <div key={`${text}-${idx}`} className="flex items-center gap-12 mx-12">
            <span className="text-[var(--lp-text)] text-[20px] md:text-[28px] font-normal tracking-wide [font-family:'Quintessential',cursive] whitespace-nowrap">
              {text}
            </span>
            <div className="w-2 h-2 rounded-full bg-[var(--lp-text)] opacity-20 shrink-0" />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
          width: fit-content;
        }
      `}</style>
    </section>
  )
}
