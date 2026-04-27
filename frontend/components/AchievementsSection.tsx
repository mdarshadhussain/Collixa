'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Lock, Star, Target, Trophy, Briefcase, MessageSquare, Megaphone, Share2, PiggyBank, Award, Compass, Loader2, X, Footprints, Lightbulb, Crown, Users, Wrench, CheckCircle2, Handshake, PenLine, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '@/lib/supabase'

const iconMap: { [key: string]: React.ElementType } = {
  Footprints,
  Lightbulb,
  Crown,
  Star,
  Handshake,
  Target,
  Trophy,
  Wrench,
  Briefcase,
  MessageSquare,
  Megaphone,
  Share2,
  PiggyBank,
  Award,
  Compass,
  Users,
  PenLine
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  reward: number
  category: string
  progress: number
  isUnlocked: boolean
  unlockedAt: string | null
  accentColor?: string
  level?: number
}

const categoryColors: { [key: string]: string } = {
  intents: '#3b82f6', // blue
  sessions: '#10b981', // green
  skills: '#f59e0b', // yellow
  social: '#8b5cf6', // purple
  credits: '#ec4899', // pink
  default: '#f97316' // orange
}

const BadgeGraphic = ({ isUnlocked, color, icon: Icon, shapeIdx }: any) => {
  const shapes = ['circle', 'pentagon', 'hexagon', 'shield'];
  const shape = isUnlocked ? shapes[shapeIdx % shapes.length] : 'shield';
  
  // High-fidelity gradients and shadows
  const id = `gradient-${shapeIdx}`;
  const filterId = `shadow-${shapeIdx}`;
  const glossId = `gloss-${shapeIdx}`;

  const renderShape = () => {
    const baseColor = isUnlocked ? color : '#e2e8f0';
    const darkColor = isUnlocked ? `${color}dd` : '#cbd5e1';
    const lightColor = isUnlocked ? `${color}ff` : '#f1f5f9';

    switch (shape) {
      case 'circle':
        return (
          <g filter={`url(#${filterId})`}>
            <circle cx="40" cy="45" r="38" fill={`url(#${id})`} stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="40" cy="45" r="30" fill="white" fillOpacity="0.1" />
            <circle cx="40" cy="45" r="30" fill={`url(#${glossId})`} />
          </g>
        );
      case 'pentagon':
        return (
          <g filter={`url(#${filterId})`}>
            <polygon points="40,5 78,32 63,80 17,80 2,32" fill={`url(#${id})`} stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <polygon points="40,14 70,36 58,72 22,72 10,36" fill="white" fillOpacity="0.1" />
            <polygon points="40,14 70,36 58,72 22,72 10,36" fill={`url(#${glossId})`} />
          </g>
        );
      case 'hexagon':
        return (
          <g filter={`url(#${filterId})`}>
            <polygon points="40,5 75,25 75,65 40,85 5,65 5,25" fill={`url(#${id})`} stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <polygon points="40,14 66,29 66,61 40,76 14,61 14,29" fill="white" fillOpacity="0.1" />
            <polygon points="40,14 66,29 66,61 40,76 14,61 14,29" fill={`url(#${glossId})`} />
          </g>
        );
      case 'shield':
      default:
        return (
          <g filter={`url(#${filterId})`}>
            <path d="M40 5 L75 18 L75 50 C75 72 40 85 40 85 C40 85 5 72 5 50 L5 18 Z" fill={`url(#${id})`} stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            <path d="M40 14 L66 24 L66 48 C66 65 40 75 40 75 C40 75 14 65 14 48 L14 24 Z" fill="white" fillOpacity="0.1" />
            <path d="M40 14 L66 24 L66 48 C66 65 40 75 40 75 C40 75 14 65 14 48 L14 24 Z" fill={`url(#${glossId})`} />
          </g>
        );
    }
  };

  return (
    <div className="relative w-24 h-24 flex items-center justify-center mb-2 mx-auto">
      <svg width="90" height="90" viewBox="0 0 80 90" className="drop-shadow-xl overflow-visible">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isUnlocked ? color : '#f1f5f9'} />
            <stop offset="100%" stopColor={isUnlocked ? `${color}bb` : '#cbd5e1'} />
          </linearGradient>
          <linearGradient id={glossId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0.3" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="black" stopOpacity="0.1" />
          </linearGradient>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(0, 2)">
          {renderShape()}
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${isUnlocked ? 'bg-white/20' : 'bg-black/5'} backdrop-blur-[2px] shadow-inner`}>
           <Icon size={20} color={isUnlocked ? "white" : "#94a3b8"} className="drop-shadow-md" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default function AchievementsSection({ userId, variant = 'full' }: { userId?: string, variant?: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    fetch(`${API_URL}/api/achievements`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
      .then(res => res.json())
      .then(data => {
        let list = data.data || [];

        // Sort: Unlocked first, then by progress percentage
        list.sort((a: Achievement, b: Achievement) => {
          if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
          const progA = a.progress / a.requirement;
          const progB = b.progress / b.requirement;
          return progB - progA;
        });

        // Ensure enough cards for a full grid (18 for 6x3)
        if (list.length < 18) {
          const padding = 18 - list.length;
          for (let i = 0; i < padding; i++) {
            list.push({
              id: `mock-${i}`,
              name: `Milestone ${list.length + 1}`,
              description: "Keep going to unlock this milestone.",
              icon: 'Compass',
              requirement: 100,
              reward: 50,
              category: 'default',
              progress: 0,
              isUnlocked: false,
              unlockedAt: null
            });
          }
        }
        setAchievements(list.slice(0, 18));
      })
      .catch(() => setError('Failed to load achievements'))
      .finally(() => setLoading(false))
  }, [userId])

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
        setScrollProgress(progress);
      }
    };

    const current = scrollRef.current;
    current?.addEventListener('scroll', handleScroll);
    return () => current?.removeEventListener('scroll', handleScroll);
  }, [achievements]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
    </div>
  );
  if (error) return <div className="text-center py-12 text-slate-400">{error}</div>;

  return (
    <div className="w-full bg-transparent p-4 sm:p-2 rounded-[2.5rem] sm:rounded-[3rem] relative overflow-hidden group/main">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-blue-500/5 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-4xl font-serif font-black text-[var(--color-text-primary)] mb-1 sm:mb-2 tracking-tighter italic leading-none uppercase">Achievements</h2>
          <p className="text-[10px] sm:text-xs font-black text-[var(--color-text-secondary)] opacity-40 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Unlock milestones to earn network credits
          </p>
        </div>
        
        {/* Creative Scroll Controls */}
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
           <button 
             onClick={() => scroll('left')}
             className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md"
           >
              <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
           </button>
           <button 
             onClick={() => scroll('right')}
             className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] flex items-center justify-center hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:scale-110 active:scale-95 transition-all shadow-xl backdrop-blur-md"
           >
              <ChevronRight size={16} className="sm:w-5 sm:h-5" />
           </button>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-8 overflow-x-auto pb-10 sm:pb-14 pt-2 sm:pt-4 px-1 snap-x snap-mandatory hide-scrollbar scroll-smooth"
        >
          {achievements.map((node, idx) => {
            const Icon = iconMap[node.icon?.split('.')[0] || 'Target'] || Target;
            const progress = Math.min(100, (node.progress / node.requirement) * 100);
            
            const cat = node.category?.toLowerCase() || 'default';
            const color = categoryColors[cat] || categoryColors.default;

            return (
              <motion.div 
                key={node.id}
                onClick={() => setSelectedAchievement(node)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.04 }}
                className="min-w-[calc(50%-8px)] sm:min-w-[calc(33.33%-16px)] lg:min-w-[calc(25%-18px)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[1.5rem] sm:rounded-[2.5rem] p-3 sm:p-8 flex flex-col items-center text-center shadow-2xl hover:border-[var(--color-accent)]/30 hover:shadow-[var(--color-accent)]/10 hover:-translate-y-2 transition-all duration-500 cursor-pointer relative group/card snap-start flex-shrink-0 backdrop-blur-sm"
              >
                {/* 3D Glass Accent */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />
                
                {/* Badge graphic scaled for mobile */}
                <div className="scale-75 sm:scale-100">
                  <BadgeGraphic isUnlocked={node.isUnlocked} color={color} icon={Icon} shapeIdx={idx} />
                </div>
                
                {/* Title & Checkmark */}
                <div className="flex items-center justify-center gap-1.5 mb-1 sm:mb-2 mt-2 sm:mt-4 relative z-10 w-full px-1">
                  <h3 className="font-black text-[var(--color-text-primary)] text-[9px] sm:text-[15px] tracking-tight truncate flex-1 italic font-serif leading-none">{node.name}</h3>
                  {node.isUnlocked && (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                       <CheckCircle2 size={8} className="text-emerald-500 sm:w-[10px] sm:h-[10px]" strokeWidth={3} />
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-[8px] sm:text-[12px] font-medium text-[var(--color-text-secondary)] opacity-60 mb-4 sm:mb-6 line-clamp-1 sm:line-clamp-2 leading-tight h-[12px] sm:h-[36px] relative z-10">
                  {node.description}
                </p>
                
                {/* Progress Bar */}
                <div className="w-full mt-auto space-y-2 sm:space-y-3">
                  <div className="relative h-1 sm:h-2 bg-[var(--color-bg-primary)] rounded-full overflow-hidden border border-[var(--color-border)]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${node.isUnlocked ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : progress > 0 ? 'bg-[var(--color-accent)] shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]' : 'bg-slate-200'}`} 
                    />
                  </div>
                  <div className="flex justify-between items-center px-0.5">
                     <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className={`w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full ${node.isUnlocked ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`} />
                        <span className="text-[6px] sm:text-[10px] font-black text-[var(--color-text-secondary)] opacity-30 uppercase tracking-[0.1em] sm:tracking-[0.2em]">Progress</span>
                     </div>
                     <span className={`text-[7px] sm:text-[12px] font-black tracking-tighter ${node.isUnlocked ? 'text-emerald-500' : 'text-[var(--color-text-secondary)] opacity-60'}`}>
                      {node.progress} <span className="opacity-10">/</span> {node.requirement}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Floating Navigation Overlay */}
        <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-[var(--color-bg-primary)] to-transparent pointer-events-none opacity-0 group-hover/main:opacity-100 transition-opacity duration-700 z-10" />
      </div>

      {/* ─── THE ASCENT TRACKER ─── */}
      <div className="mt-2 sm:mt-4 px-1 sm:px-2 relative z-10">
         <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-[7px] sm:text-[10px] font-black text-[var(--color-text-secondary)] opacity-10 uppercase tracking-[0.3em]">Start</span>
            <div className="flex-1 h-[1px] sm:h-[2px] bg-[var(--color-border)] rounded-full relative overflow-hidden">
               <motion.div 
                 className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--color-accent)] to-blue-500 shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
                 style={{ width: `${scrollProgress}%` }}
               />
            </div>
            <span className="text-[7px] sm:text-[10px] font-black text-[var(--color-text-secondary)] opacity-10 uppercase tracking-[0.3em]">End</span>
         </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedAchievement && (() => {
          const a = selectedAchievement;
          const Icon = iconMap[a.icon?.split('.')[0] || 'Target'] || Target;
          const progress = Math.min(100, (a.progress / a.requirement) * 100);
          
          const cat = a.category?.toLowerCase() || 'default';
          const color = categoryColors[cat] || categoryColors.default;

          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAchievement(null)}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-[var(--color-bg-secondary)] rounded-[3rem] p-10 md:p-14 w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)] z-20 border border-[var(--color-border)]"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-8 right-8 p-2 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center gap-5">
                  <BadgeGraphic isUnlocked={a.isUnlocked} color={color} icon={Icon} shapeIdx={achievements.findIndex(x => x.id === a.id)} />

                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif font-black italic text-[var(--color-text-primary)] italic leading-none">{a.name}</h3>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[var(--color-accent)] opacity-80">{a.category} milestone</p>
                    <p className="text-sm text-[var(--color-text-secondary)] opacity-70 mt-4 leading-relaxed font-medium">{a.description}</p>
                  </div>

                  {/* Progress detail */}
                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] opacity-40">
                      <span>Network Progress</span>
                      <span className="text-[var(--color-text-primary)]">{a.progress} <span className="opacity-20">/</span> {a.requirement}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--color-bg-primary)] overflow-hidden border border-[var(--color-border)] shadow-inner">
                      <motion.div
                        className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.5)]"
                        style={{ backgroundColor: color, width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-3xl px-8 py-6 w-full flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black text-[var(--color-text-secondary)] opacity-40 uppercase tracking-[0.3em] mb-1">Network Reward</p>
                       <p className="text-2xl font-serif font-black italic text-[var(--color-accent)] drop-shadow-sm">+{a.reward} <span className="text-[var(--color-text-secondary)] opacity-40 text-sm not-italic font-black">Creds</span></p>
                    </div>
                    <div className="p-3 bg-[var(--color-accent)]/10 rounded-2xl">
                       <Award size={24} className="text-[var(--color-accent)]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
