'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CustomDateTimePickerProps {
  value: string // ISO string or YYYY-MM-DDTHH:mm
  onChange: (value: string) => void
  minDate?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function CustomDateTimePicker({
  value,
  onChange,
  minDate,
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'date' | 'time'>('date')
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse initial value
  const initialDate = value ? new Date(value) : new Date()
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(initialDate)

  // Synchronize state when value prop changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setSelectedDate(d)
      }
    }
  }, [value])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    
    // Padding for start of month
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, month - 1, prevMonthDays - i) })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month: 'current', date: new Date(year, month, i) })
    }
    
    // Padding for end of month
    const remaining = 42 - days.length // Total 6 rows
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: 'next', date: new Date(year, month + 1, i) })
    }
    
    return days
  }, [viewDate])

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(selectedDate)
    newDate.setFullYear(date.getFullYear())
    newDate.setMonth(date.getMonth())
    newDate.setDate(date.getDate())
    setSelectedDate(newDate)
    setMode('time') // Auto switch to time selection
  }

  const handleTimeChange = (type: 'hour' | 'minute', val: number) => {
    const newDate = new Date(selectedDate)
    if (type === 'hour') newDate.setHours(val)
    else newDate.setMinutes(val)
    setSelectedDate(newDate)
  }

  const confirmSelection = () => {
    onChange(selectedDate.toISOString())
    setIsOpen(false)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear()
  }

  const isPast = (date: Date) => {
    if (!minDate) return false
    const min = new Date(minDate)
    return date < new Date(min.getFullYear(), min.getMonth(), min.getDate())
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[13px] font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-all group shadow-sm overflow-hidden"
      >
        <CalendarIcon size={16} className="text-[var(--color-accent)] opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="flex-1 text-left">
          {selectedDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
        <Clock size={16} className="text-[var(--color-text-secondary)] opacity-40" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            className="relative z-10 mt-2 mx-auto max-w-[250px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[1rem] shadow-sm p-2.5 space-y-2.5 overflow-hidden"
          >
            {/* Mode Switcher */}
            <div className="flex bg-[var(--color-bg-secondary)] p-0.5 rounded-full border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setMode('date')}
                className={`flex-1 py-1 rounded-full text-[7.5px] font-black uppercase tracking-wider transition-all ${mode === 'date' ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)]' : 'text-[var(--color-text-secondary)]'}`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setMode('time')}
                className={`flex-1 py-1 rounded-full text-[7.5px] font-black uppercase tracking-wider transition-all ${mode === 'time' ? 'bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)]' : 'text-[var(--color-text-secondary)]'}`}
              >
                Time
              </button>
            </div>

            {mode === 'date' ? (
              <div className="space-y-1.5">
                {/* Calendar Header */}
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-serif font-black italic text-[11px] leading-none">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                  </h4>
                  <div className="flex gap-1">
                    <button type="button" onClick={handlePrevMonth} className="p-0.5 hover:bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border)]"><ChevronLeft size={10} /></button>
                    <button type="button" onClick={handleNextMonth} className="p-0.5 hover:bg-[var(--color-bg-secondary)] rounded-full border border-[var(--color-border)]"><ChevronRight size={10} /></button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px">
                  {DAYS.map(day => (
                    <div key={day} className="text-center py-0.5 text-[6.5px] font-black tracking-widest text-[var(--color-text-secondary)] uppercase opacity-30">{day}</div>
                  ))}
                  {calendarDays.map((dateObj, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => !isPast(dateObj.date) && handleDateSelect(dateObj.date)}
                      disabled={isPast(dateObj.date)}
                      className={`
                        relative w-full aspect-square flex items-center justify-center rounded-full text-[8.5px] font-bold transition-all
                        ${dateObj.month !== 'current' ? 'opacity-10' : 'opacity-100'}
                        ${isSelected(dateObj.date) ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)] shadow-sm' : 'hover:bg-[var(--color-accent-soft)]/50 hover:text-[var(--color-accent)]'}
                        ${isPast(dateObj.date) ? 'cursor-not-allowed opacity-5' : 'cursor-pointer'}
                      `}
                    >
                      {dateObj.day}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="flex justify-around items-center gap-2">
                  <div className="text-center space-y-1 flex-1">
                    <p className="text-[6.5px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Hr</p>
                    <div className="h-16 overflow-y-auto no-scrollbar bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] p-1">
                      {[...Array(24)].map((_, h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleTimeChange('hour', h)}
                          className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${selectedDate.getHours() === h ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)]' : 'hover:bg-[var(--color-bg-primary)]'}`}
                        >
                          {h.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-serif font-black flex items-center mt-3 text-[var(--color-accent)] opacity-20">:</div>
                  <div className="text-center space-y-1 flex-1">
                    <p className="text-[6.5px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Min</p>
                    <div className="h-16 overflow-y-auto no-scrollbar bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border)] p-1">
                      {[0, 15, 30, 45].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleTimeChange('minute', m)}
                          className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${selectedDate.getMinutes() === m ? 'bg-[var(--color-accent)] text-[var(--color-inverse-text)]' : 'hover:bg-[var(--color-bg-primary)]'}`}
                        >
                          {m.toString().padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between">
              <div className="text-[8px]">
                <span className="font-serif italic font-black text-[9px] text-[var(--color-accent)]">{selectedDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <button
                type="button"
                onClick={confirmSelection}
                className="px-3 py-1 bg-[var(--color-inverse-bg)] text-[var(--color-inverse-text)] rounded-full text-[7.5px] font-black uppercase tracking-wider hover:bg-[var(--color-accent)] transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
