'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/app/context/AuthContext';
import { useTheme } from '@/app/context/ThemeContext';
import {
  ArrowRight,
  Search,
  Users,
  MessageSquare,
  Shield,
  ArrowUpRight,
  ChevronDown,
} from 'lucide-react';
import Header from '@/components/Header';

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 100]);

  /* ── data ── */
  const features = [
    { icon: Search, title: 'Smart Discovery', desc: 'Find collaborations that align with your goals using intelligent matching.' },
    { icon: Users, title: 'Skill Exchange', desc: "Teach what you know and learn what you need — a shared talent ecosystem." },
    { icon: MessageSquare, title: 'Direct Connection', desc: "Connect instantly with matched collaborators through built-in messaging." },
    { icon: Shield, title: 'Verified Profiles', desc: "Trust badges ensure you're always working with the best in the field." },
  ];

  const stats = [
    { value: '10K+', label: 'Active Intents' },
    { value: '25K+', label: 'Collaborators' },
    { value: '98%', label: 'Match Rate' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans selection:bg-[var(--color-accent-soft)] selection:text-[var(--color-accent)] transition-colors duration-700">
      
      <Header />

      {/* ─── EDITORIAL HERO ─── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center py-12 overflow-hidden">
        <motion.div 
          style={{ y: yHero }}
          className="container mx-auto px-6 relative z-10 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center mb-10"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--color-accent)] mb-6">Established 2026</span>
            <h1 className="text-6xl md:text-8xl lg:text-[7.5rem] font-serif font-black leading-[0.9] tracking-tighter mb-8 max-w-5xl mx-auto">
              Where Intent <br />
              <span className="italic font-light">meets</span> Action.
            </h1>
            <p className="font-sans text-sm md:text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-loose tracking-[0.05em] mb-12 uppercase">
              The premium skill-exchange & collaboration ecosystem for those who build with purpose.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button 
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/auth?mode=register')}
                className="group px-10 py-5 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:bg-[var(--color-accent)] transition-all duration-700"
              >
                Initialize Intent
                <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })}
                className="group px-6 py-5 text-[11px] font-bold uppercase tracking-[0.3em] flex items-center gap-4 hover:translate-y-1 transition-all duration-700 text-[var(--color-text-primary)]"
              >
                The Vision 
                <ChevronDown size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Ambient Hero Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: theme === 'dark' ? 0.3 : 0.15, scale: 1 }}
          transition={{ duration: 2.5, ease: 'easeOut' }}
          className="absolute inset-0 pointer-events-none z-0"
        >
          <img 
            src="/collixa_hero_collab_1776003055873.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover grayscale brightness-125 dark:brightness-50"
          />
          <div className="absolute inset-0 bg-[var(--color-bg-primary)]/70" />
        </motion.div>

        <div className="absolute bottom-10 left-12 hidden md:block">
          <div className="flex flex-col gap-4">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-serif text-xl font-bold">{s.value}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE MANIFESTO ─── */}
      <section id="vision" className="py-32 md:py-48 bg-[var(--color-bg-secondary)] overflow-hidden transition-colors duration-700">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <FadeInSection>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--color-accent)] mb-12">Our Philosophy</h2>
              <p className="font-serif text-3xl md:text-5xl leading-tight text-[var(--color-text-primary)] mb-12">
                We believe that the <span className="italic">future of work</span> isn't just about networking—it's about the <span className="text-[var(--color-accent)]">deliberate exchange</span> of talent.
              </p>
              <p className="text-[var(--color-text-secondary)] font-sans leading-loose max-w-md text-sm mb-12">
                Collixa is a sanctuary for builders, designers, and visionaries. We've removed the noise of generic talent boards, creating a space where purely qualified intents drive every interaction.
              </p>
              <button className="group text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 border-b-2 border-[var(--color-accent)] pb-2 hover:border-[var(--color-text-primary)] transition-all">
                The full story <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </FadeInSection>
            
            <FadeInSection delay={0.3} className="relative">
              <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-1000 border border-[var(--color-border)]">
                <img 
                  src="/collixa_skill_exchange_1776003081601.png" 
                  alt="Skill Exchange" 
                  className="w-full h-full object-cover grayscale dark:brightness-90"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[var(--color-accent-soft)] rounded-full z-[-1] opacity-50" />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── STAGGERED FEATURES ─── */}
      <section id="intents" className="py-32 bg-[var(--color-bg-primary)]">
        <div className="container mx-auto px-6 md:px-12">
          {/* Section Header */}
          <FadeInSection className="text-center mb-24">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[var(--color-accent)] mb-6 block">Capabilities</span>
            <h3 className="text-4xl md:text-6xl font-serif font-black">Refined Features, <br />Purpose-Built.</h3>
          </FadeInSection>

          {/* Staggered Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((f, i) => (
              <FadeInSection key={i} delay={i * 0.15} className="group cursor-default">
                <div className="mb-8 w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-bg-primary)] transition-all duration-700 shadow-sm">
                  <f.icon size={22} strokeWidth={1.5} />
                </div>
                <h4 className="text-xl font-serif font-bold mb-4">{f.title}</h4>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed tracking-wider">{f.desc}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIFESTYLE CALLOUT ─── */}
      <section id="community" className="py-24 md:py-48 relative overflow-hidden bg-[var(--color-bg-secondary)] border-y border-[var(--color-border)]">
        <div className="absolute inset-0 opacity-10 dark:opacity-30 pointer-events-none">
          <img 
            src="/collixa_community_lifestyle_1776003104238.png" 
            alt="Community" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <FadeInSection>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[var(--color-accent)] mb-8">Join the collective</h2>
            <p className="font-serif text-4xl md:text-7xl mb-12 leading-tight">
              A community defined by <br />
              <span className="italic">craftsmanship</span> and <span className="text-[var(--color-accent)]">mutual growth</span>.
            </p>
            <button 
              onClick={() => router.push('/auth?mode=register')}
              className="px-12 py-6 border border-[var(--color-text-primary)] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[var(--color-text-primary)] hover:text-[var(--color-bg-primary)] transition-all duration-700"
            >
              Request Access
            </button>
          </FadeInSection>
        </div>
      </section>

      {/* ─── THE JOURNAL (Stats / Last CTA) ─── */}
      <section className="py-32 md:py-48 bg-[var(--color-bg-primary)]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-20 border-b border-[var(--color-border)] pb-24">
            <FadeInSection className="lg:w-1/2">
              <h3 className="text-4xl md:text-6xl font-serif font-black mb-10 leading-none">Ready to deploy your next intentional project?</h3>
              <p className="text-[var(--color-text-secondary)] font-sans text-sm uppercase tracking-widest leading-loose">
                Post your intent today. Find the missing talent. <br />Grow your vision beyond expectations.
              </p>
            </FadeInSection>

            <FadeInSection className="lg:w-1/3 w-full flex flex-col gap-6">
              <button 
                onClick={() => router.push('/auth?mode=register')}
                className="w-full py-6 bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] hover:shadow-2xl transition-all"
              >
                Sign Up Collectively
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-6 border border-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.3em] bg-[var(--color-text-primary)] hover:bg-transparent hover:text-[var(--color-text-primary)] transition-all"
              >
                Explore Marketplace
              </button>
            </FadeInSection>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-20">
            {['Inspiration', 'Integration', 'Collaboration', 'Persistence'].map((label, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[var(--color-text-secondary)]">{label}</span>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-20 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors duration-700">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-[var(--color-accent)] font-serif text-sm font-bold">C</span>
                </div>
                <span className="font-serif text-lg font-black tracking-widest uppercase">Collixa</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest">© 2026 Collection of Intents. All rights reserved.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-10 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
              <span onClick={() => router.push('/auth?mode=login')} className="hover:text-[var(--color-accent)] cursor-pointer transition-colors">Login</span>
              <span onClick={() => router.push('/auth?mode=register')} className="hover:text-[var(--color-accent)] cursor-pointer transition-colors">Join</span>
              <span className="hover:text-[var(--color-accent)] cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-[var(--color-accent)] cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-[var(--color-accent)] cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Decorative Textures */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
