'use client'

import { useState, useEffect } from 'react'
import { Lock, Star, Target, Trophy, Briefcase, MessageSquare, Megaphone, Share2, PiggyBank, Award, Compass, Loader2, X, Footprints, Lightbulb, Crown, Users, Wrench, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '@/lib/supabase'

const iconMap: { [key: string]: React.ElementType } = {
  Footprints, Lightbulb, Crown, Star, Handshake: Users, Target,
  Trophy, Wrench, Toolbox: Briefcase, MessageSquare, Megaphone,
  Share2, PiggyBank, Award, Compass
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
    <div className="relative w-20 h-24 flex items-center justify-center mb-2">
      <svg width="80" height="90" viewBox="0 0 80 90" className="drop-shadow-xl">
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
            <feOffset dx="1" dy="1.5" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {renderShape()}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pb-1">
        <div className={`p-2 rounded-full ${isUnlocked ? 'bg-white/20' : 'bg-black/5'} backdrop-blur-[1px] shadow-inner`}>
           <Icon size={18} color={isUnlocked ? "white" : "#94a3b8"} className="drop-shadow-md" strokeWidth={2.5} />
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-[var(--color-accent)]" size={28} />
    </div>
  );
  if (error) return <div className="text-center py-12 text-slate-400">{error}</div>;

  return (
    <div className="w-full bg-[#f8fafc] p-6 rounded-[2.5rem]">
      {/* Header matching the image */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Achievements</h2>
        <p className="text-[11px] font-medium text-slate-500 tracking-tight">Unlock your achievements by completing tasks on the platform</p>
      </div>

      {/* Grid Layout - Changed to 6 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
        {achievements.map((node, idx) => {
          const Icon = iconMap[node.icon?.split('.')[0] || 'Target'] || Target;
          const progress = Math.min(100, (node.progress / node.requirement) * 100);
          
          const cat = node.category?.toLowerCase() || 'default';
          const color = categoryColors[cat] || categoryColors.default;

          return (
            <motion.div 
              key={node.id}
              onClick={() => setSelectedAchievement(node)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-[2rem] p-5 flex flex-col items-center text-center border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:scale-[1.03] transition-all cursor-pointer relative group overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Badge graphic scaled down */}
              <BadgeGraphic isUnlocked={node.isUnlocked} color={color} icon={Icon} shapeIdx={idx} />
              
              {/* Title & Checkmark */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <h3 className="font-black text-slate-800 text-[13px] tracking-tight truncate max-w-full">{node.name}</h3>
                {node.isUnlocked && (
                  <CheckCircle2 size={12} className="text-emerald-500" strokeWidth={3} />
                )}
              </div>
              
              {/* Description smaller */}
              <p className="text-[10px] font-medium text-slate-400 mb-4 line-clamp-2 leading-tight">
                {node.description}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full mt-auto space-y-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${node.isUnlocked ? 'bg-emerald-500' : progress > 0 ? 'bg-blue-600' : 'bg-slate-300'}`} 
                  />
                </div>
                <div className="flex justify-end">
                   <span className={`text-[9px] font-black tracking-tighter ${node.isUnlocked ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {node.progress}/{node.requirement}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

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
                className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl z-20 border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center gap-5">
                  <BadgeGraphic isUnlocked={a.isUnlocked} color={color} icon={Icon} shapeIdx={achievements.findIndex(x => x.id === a.id)} />

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{a.name}</h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">{a.description}</p>
                  </div>

                  {/* Progress detail */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span className="font-semibold text-slate-600">{a.progress} / {a.requirement}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ backgroundColor: color, width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Reward */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 w-full">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Reward</p>
                    <p className="text-lg font-bold text-slate-800">+{a.reward} Credits</p>
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
