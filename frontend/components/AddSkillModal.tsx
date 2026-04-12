'use client'

import { useState } from 'react'
import { X, Plus, Sparkles, BookOpen, Layers } from 'lucide-react'
import { skillService } from '@/lib/supabase'

interface AddSkillModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const LEVELS = ['Beginner', 'Intermediate', 'Expert', 'Master']
const CATEGORIES = ['Development', 'Design', 'Marketing', 'Data Science', 'Writing', 'Business', 'Other']

export default function AddSkillModal({ isOpen, onClose, onSuccess }: AddSkillModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level: 'Intermediate',
    category: 'Development',
    description: ''
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await skillService.addSkill(formData)
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        alert(res.error || 'Failed to add skill')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-accent)] italic">Contribution</span>
              <h2 className="text-4xl font-serif font-black tracking-tighter">List your <br /><span className="italic font-light text-[var(--color-accent)]">expertise.</span></h2>
            </div>
            <button onClick={onClose} className="p-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-accent-soft)] transition-all">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-3 ml-1">
                  <Sparkles size={12} className="text-[var(--color-accent)]" />
                  Skill Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Next.js Architecture"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm font-medium focus:border-[var(--color-accent)] outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-3 ml-1">
                  <Layers size={12} className="text-[var(--color-accent)]" />
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-6 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-[var(--color-accent)] outline-none transition-all cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] flex items-center gap-3 ml-1">
                <BookOpen size={12} className="text-[var(--color-accent)]" />
                Expertise Level
              </label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, level })}
                    className={`px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                      formData.level === level 
                        ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]' 
                        : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)] ml-1">Description</label>
              <textarea
                placeholder="Briefly describe what you can help with..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-6 py-4 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl text-sm font-medium focus:border-[var(--color-accent)] outline-none transition-all resize-none"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-6 bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] text-[10px] font-black uppercase tracking-[0.4em] rounded-[1.5rem] hover:bg-[var(--color-accent)] transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-40"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[var(--color-bg-primary)] border-t-transparent animate-spin rounded-full" />
              ) : (
                <>
                  <Plus size={18} />
                  Add Expertise
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
