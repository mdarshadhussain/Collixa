'use client'

import Link from 'next/link'
import { Instagram, Twitter, Linkedin, Github } from 'lucide-react'

interface FooterProps {
  onLegalClick?: () => void
}

export default function Footer({ onLegalClick }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer data-cursor-theme="dark" className="bg-[var(--lp-text)] text-white py-12 px-6 md:px-12 border-t border-white/5">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Left: Brand & Copy */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <Link href="/" className="group">
            <span className="text-[24px] font-['Nunito'] font-extrabold tracking-[-0.05em] text-[var(--lp-primary)] transition-transform group-hover:scale-105 block">
              Collixa.
            </span>
          </Link>
          <p className="text-[12px] text-white/30 font-sans tracking-wide">
            &copy; {currentYear} Collixa. Built with intent.
          </p>
        </div>

        {/* Center: Minimal Links */}
        <nav className="flex items-center gap-8">
          <Link href="/dashboard" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Platform</Link>
          <Link href="#features" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Features</Link>
          <button 
            onClick={onLegalClick}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
          >
            Legal
          </button>
        </nav>

        {/* Right: Socials */}
        <div className="flex gap-6">
          {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
            <a
              key={i}
              href="#"
              className="text-[var(--lp-primary)] hover:opacity-80 transition-opacity"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
