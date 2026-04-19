'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Send, Award, MessageSquare } from 'lucide-react'
import Button from './Button'

interface IntentReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string) => Promise<void>
  intentTitle: string
  partnerName: string
}

export default function IntentReviewModal({
  isOpen,
  onClose,
  onSubmit,
  intentTitle,
  partnerName
}: IntentReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    try {
      setIsSubmitting(true)
      await onSubmit(rating, comment)
      onClose()
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-accent)] mb-2">Collaboration Feedback</p>
                <h2 className="text-2xl font-serif font-black text-[var(--color-text-primary)]">{intentTitle}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-primary)] rounded-full transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Rating Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <Award size={16} className="text-[var(--color-accent)]" />
                   <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-80">How was the collaboration with {partnerName}?</p>
                </div>
                <div className="flex justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="transition-all duration-300 transform hover:scale-125"
                    >
                      <Star
                        size={32}
                        className={`${
                          star <= (hover || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-[var(--color-border)]'
                        } transition-colors duration-300`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-[10px] font-serif italic text-[var(--color-text-secondary)] opacity-60">
                  {rating === 5 ? 'Masterful Collaboration' : 
                   rating === 4 ? 'Professional Experience' : 
                   rating === 3 ? 'Successful Connection' : 
                   rating === 2 ? 'Modest Contribution' : 
                   rating === 1 ? 'Needs Improvement' : 'Select a rating to record your endorsement'}
                </p>
              </div>

              {/* Comment Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <MessageSquare size={16} className="text-[var(--color-accent)]" />
                   <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-80">Add a testimonial (Optional)</p>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Express your gratitude or share what made this collaboration special..."
                  className="w-full h-32 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl p-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/40 focus:outline-none focus:border-[var(--color-accent)]/50 transition-all resize-none font-medium"
                />
              </div>

              {/* Footer */}
              <div className="pt-4">
                <Button
                  fullWidth
                  variant="accent"
                  className="py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-xl shadow-[var(--color-accent)]/10"
                  disabled={rating === 0 || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 justify-center">
                       <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Recording Endorsement...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      <Send size={16} /> Publish Feedback
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[var(--color-accent)] opacity-10 rounded-full blur-[80px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
