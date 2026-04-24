'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Send, Award, MessageSquare, Users, Loader2 } from 'lucide-react'
import Button from './Button'
import Avatar from './Avatar'

interface IntentReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string, revieweeId?: string) => Promise<void>
  intentTitle: string
  partnerName: string
  isOwner?: boolean
  collaborators?: any[]
}

export default function IntentReviewModal({
  isOpen,
  onClose,
  onSubmit,
  intentTitle,
  partnerName,
  isOwner = false,
  collaborators = []
}: IntentReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Use an array for multiple selection
  const [selectedIds, setSelectedIds] = useState<string[]>(
    isOwner && collaborators.length > 0 ? [collaborators[0].id] : []
  )

  const toggleCollaborator = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    if (isOwner && selectedIds.length === 0) return

    try {
      setIsSubmitting(true)
      
      if (isOwner) {
        // Submit for each selected collaborator
        await Promise.all(selectedIds.map(id => onSubmit(rating, comment, id)))
      } else {
        await onSubmit(rating, comment)
      }
      
      onClose()
      // Reset state
      setRating(0)
      setComment('')
      setSelectedIds(isOwner && collaborators.length > 0 ? [collaborators[0].id] : [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-white border border-[var(--color-border)] rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header - More Compact */}
            <div className="p-6 pb-0 flex justify-between items-start">
              <div className="pr-8">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-accent)] mb-1">Collaboration Feedback</p>
                <h2 className="text-xl font-serif font-black text-[var(--color-text-primary)] leading-tight">{intentTitle}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-primary)] rounded-full transition-colors text-[var(--color-text-secondary)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Participant Selection (for Owners) */}
              {isOwner && collaborators.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[var(--color-accent-soft)]/20 flex items-center justify-center">
                      <Users size={10} className="text-[var(--color-accent)]" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-80">Select partners to endorse</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {collaborators.map((col) => {
                      const isSelected = selectedIds.includes(col.id);
                      return (
                        <button
                          key={col.id}
                          onClick={() => toggleCollaborator(col.id)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                            isSelected 
                            ? 'bg-[var(--color-accent)]/5 border-[var(--color-accent)] shadow-sm' 
                            : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100 hover:border-gray-200'
                          }`}
                        >
                          <Avatar size="xs" src={col.avatar_url} name={col.name} className={isSelected ? 'ring-2 ring-[var(--color-accent)] ring-offset-1' : ''} />
                          <div className="flex-1 text-left">
                            <span className={`text-[10px] font-bold tracking-tight block truncate ${isSelected ? 'text-[var(--color-accent)]' : 'text-gray-600'}`}>
                              {col.name || 'Partner'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rating Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-[var(--color-accent-soft)]/20 flex items-center justify-center">
                     <Award size={10} className="text-[var(--color-accent)]" />
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-80">
                     Endorsement level
                   </p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                        className="transition-all duration-300 transform hover:scale-125 active:scale-95"
                      >
                        <Star
                          size={28}
                          className={`${
                            star <= (hover || rating)
                              ? 'text-[var(--color-accent)] fill-[var(--color-accent)]'
                              : 'text-gray-200'
                          } transition-all duration-300`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-1.5 bg-[var(--color-accent-soft)]/10 rounded-full">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
                      {rating === 5 ? 'Masterful Collaboration' : 
                       rating === 4 ? 'Professional Experience' : 
                       rating === 3 ? 'Successful Connection' : 
                       rating === 2 ? 'Modest Contribution' : 
                       rating === 1 ? 'Needs Improvement' : 'Rate your partners'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-[var(--color-accent-soft)]/20 flex items-center justify-center">
                     <MessageSquare size={10} className="text-[var(--color-accent)]" />
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text-secondary)] opacity-80">Testimonial</p>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share a short note about this collaboration..."
                  className="w-full h-24 bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-[var(--color-accent)]/30 focus:bg-white transition-all resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Footer */}
              <div className="pt-2">
                <Button
                  fullWidth
                  variant="accent"
                  className="py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] shadow-lg shadow-[var(--color-accent)]/10"
                  disabled={rating === 0 || isSubmitting || (isOwner && selectedIds.length === 0)}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                       <Loader2 className="w-3 h-3 animate-spin" /> Publishing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Send size={14} /> Publish Feedback
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
