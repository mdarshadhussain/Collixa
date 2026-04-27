'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, Layers, Edit2, Plus, Clock, FileText, Star, Users, CalendarClock, Trash2 } from 'lucide-react'
import { skillService } from '@/lib/supabase'
import { notify } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import CustomDateTimePicker from './CustomDateTimePicker'

interface AddSkillModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  skill?: any // For editing
}

const LEVELS = ['Beginner', 'Intermediate', 'Expert', 'Master']
const CATEGORIES = ['Development', 'Design', 'Marketing', 'Data Science', 'Writing', 'Business', 'Other']

export default function AddSkillModal({ isOpen, onClose, onSuccess, skill }: AddSkillModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: skill?.name || '',
    level: skill?.level || 'Intermediate',
    category: skill?.category || 'Development',
    description: skill?.description || '',
    max_members: skill?.max_members || 5,
    session_fee: skill?.session_fee || 20,
    duration: skill?.duration || '',
    schedule: skill?.schedule || [],
    status: skill?.status || 'active'
  })

  // Update form if skill changes (when modal opens)
  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name,
        level: skill.level,
        category: skill.category,
        description: skill.description,
        max_members: skill.max_members || 5,
        session_fee: skill.session_fee || 20,
        duration: skill.duration || '',
        schedule: skill.schedule || [],
        status: skill.status || 'active'
      })
    } else {
      setFormData({
        name: '',
        level: 'Intermediate',
        category: 'Development',
        description: '',
        max_members: 5,
        session_fee: 20,
        duration: '',
        schedule: [],
        status: 'active'
      })
    }
  }, [skill, isOpen])

  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) return null

  const addSlot = () => {
    setFormData({
      ...formData,
      schedule: [...formData.schedule, { date: new Date().toISOString().split('T')[0], time: '10:00' }]
    })
  }

  const removeSlot = (index: number) => {
    const newSchedule = [...formData.schedule]
    newSchedule.splice(index, 1)
    setFormData({ ...formData, schedule: newSchedule })
  }

  const updateSlot = (index: number, field: string, value: string) => {
    const newSchedule = [...formData.schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    setFormData({ ...formData, schedule: newSchedule })
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    try {
      const res = skill 
      ? await skillService.updateSkill(skill.id, formData)
      : await skillService.addSkill(formData)
        
      if (res.success) {
        notify.success(skill ? 'Tribe updated successfully!' : 'Tribe submitted for approval! It will be visible to others once approved by an admin.')
        onSuccess()
        onClose()
      } else {
        const errorMsg = res.error || res.message || `Failed to ${skill ? 'update' : 'add'} skill`;
        setFormError(errorMsg);
        notify.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Submit Error:', err)
      const errorMsg = err.message || 'An error occurred while saving your expertise.';
      setFormError(errorMsg);
      notify.error(errorMsg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <form onSubmit={handleSubmit} className="p-8 md:p-10">
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-black tracking-tight text-[var(--color-text-primary)]">
                    {skill ? 'Evolve your' : 'Build your'}{' '}
                    <span className="italic font-light text-[var(--color-accent)]">future.</span>
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-text-secondary)] mt-2 opacity-50">
                    {skill ? 'Revision of your tribal parameters' : 'Establishment of your domain'}
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={onClose} 
                  className="p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full hover:bg-[var(--color-accent-soft)] transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Skill Name */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="md:w-32 flex items-center gap-2 shrink-0">
                    <Sparkles size={12} className="text-[var(--color-accent)]" />
                    <label className="editorial-label mb-0">Name</label>
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Next.js Mastery"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="editorial-input flex-1"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="md:w-32 flex items-center gap-2 shrink-0">
                    <Layers size={12} className="text-[var(--color-accent)]" />
                    <label className="editorial-label mb-0">Category</label>
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="editorial-input flex-1 appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Level */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <div className="md:w-32 flex items-center gap-2 shrink-0">
                    <Star size={12} className="text-[var(--color-accent)]" />
                    <label className="editorial-label mb-0">Level</label>
                  </div>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {LEVELS.map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFormData({ ...formData, level })}
                        className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                          formData.level === level 
                            ? 'bg-[var(--color-accent)] text-black' 
                            : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] opacity-60 hover:opacity-100'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration, Limit & Fee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 flex items-center gap-2 shrink-0">
                      <Clock size={12} className="text-[var(--color-accent)]" />
                      <label className="editorial-label mb-0">Duration</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. 4 Weeks"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="editorial-input flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 flex items-center gap-2 shrink-0">
                      <Users size={12} className="text-[var(--color-accent)]" />
                      <label className="editorial-label mb-0">Limit</label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_members}
                      onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                      className="editorial-input flex-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 flex items-center gap-2 shrink-0">
                      <Sparkles size={12} className="text-[var(--color-accent)]" />
                      <label className="editorial-label mb-0 whitespace-nowrap">Session Fee</label>
                    </div>
                    <div className="relative flex-1">
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="20"
                        value={formData.session_fee}
                        onChange={(e) => setFormData({ ...formData, session_fee: parseInt(e.target.value) })}
                        className="editorial-input w-full pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase opacity-40">Creds</span>
                    </div>
                  </div>
                </div>


                {/* Status Selection (only for editing) */}
                {skill && (
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="md:w-32 flex items-center gap-2 shrink-0">
                      <Sparkles size={12} className="text-[var(--color-accent)]" />
                      <label className="editorial-label mb-0">Status</label>
                    </div>
                    <div className="flex gap-2 flex-1">
                      {['active', 'inactive'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s })}
                          className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${
                            formData.status === s 
                              ? 'bg-[var(--color-accent)] text-black' 
                              : 'bg-[var(--color-bg-primary)] border border-[var(--color-border)] opacity-60 hover:opacity-100'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schedule Slots */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarClock size={12} className="text-[var(--color-accent)]" />
                      <label className="editorial-label mb-0">Weekly Slots</label>
                    </div>
                    <button
                      type="button"
                      onClick={addSlot}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-accent-soft)]/20 text-[var(--color-accent)] rounded-full hover:bg-[var(--color-accent-soft)]/40 transition-all text-[8px] font-black uppercase tracking-widest"
                    >
                      <Plus size={10} /> Add Slot
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.schedule.map((slot: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 group">
                        <div className="flex-1">
                          <CustomDateTimePicker
                            value={`${slot.date || new Date().toISOString().split('T')[0]}T${slot.time || '10:00'}:00`}
                            onChange={(val) => {
                              const d = new Date(val)
                              if (isNaN(d.getTime())) return // Fallback protection
                              // Extract local date and time to preserve timezone correctly
                              const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
                              const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
                              
                              const newSchedule = [...formData.schedule]
                              // Overwrite 'day' to fully convert to 'date' format
                              if ('day' in newSchedule[index]) delete newSchedule[index].day;
                              newSchedule[index] = { ...newSchedule[index], date: dateStr, time: timeStr }
                              setFormData({ ...formData, schedule: newSchedule })
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {formData.schedule.length === 0 && (
                      <p className="text-[9px] text-[var(--color-text-secondary)] opacity-40 italic py-2">No slots added yet. Define your availability.</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={12} className="text-[var(--color-accent)]" />
                    <label className="editorial-label mb-0">Description</label>
                  </div>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your mastery..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="editorial-input w-full resize-none py-4"
                  />
                </div>
              </div>

              {/* Inline Error Banner */}
              {formError && (
                <div className="mt-6 flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                  <div className="p-1.5 bg-red-500/20 rounded-lg shrink-0 mt-0.5">
                    <X size={14} className="text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Cannot Proceed</p>
                    <p className="text-sm text-red-300 font-medium leading-relaxed">{formError}</p>
                  </div>
                  <button type="button" onClick={() => setFormError(null)} className="p-1 text-red-500/50 hover:text-red-500 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Action Button */}
              <Button
                type="submit"
                variant="accent"
                fullWidth
                loading={loading}
                className="mt-8 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-[var(--color-accent)]/20"
              >
                <div className="flex items-center justify-center gap-3">
                  {skill ? <Edit2 size={14} /> : <Plus size={14} />}
                  {skill ? 'Update Mission' : 'Establish Tribe'}
                </div>
              </Button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
