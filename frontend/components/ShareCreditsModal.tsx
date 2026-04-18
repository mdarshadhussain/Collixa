'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Search, Send, User as UserIcon, Loader2 } from 'lucide-react'
import { useAuth } from '@/app/context/AuthContext'
import { notify } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
}

interface ShareCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ShareCreditsModal({ isOpen, onClose, onSuccess }: ShareCreditsModalProps) {
  const router = useRouter()
  const { user: currentUser, refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Reset state when modal opens
    if (isOpen) {
      setEmail('')
      setAmount('')
      setMessage('')
      setFoundUser(null)
      setError('')
      setSuccess('')
    }
  }, [isOpen])

  // Search for user by email
  const searchUser = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setSearching(true)
    setError('')
    setFoundUser(null)

    try {
      const response = await fetch(`${API_URL}/api/credits/search-user?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setFoundUser(data.data)
      } else {
        setError(data.error || 'User not found with this email')
      }
    } catch (err) {
      setError('Failed to search for user')
    } finally {
      setSearching(false)
    }
  }

  // Handle email input change - clear found user when email changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setFoundUser(null)
    setError('')
  }

  // Send credits
  const handleSend = async () => {
    if (!foundUser) {
      setError('Please search for a valid user first')
      return
    }

    const creditAmount = parseInt(amount)
    if (!creditAmount || creditAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (creditAmount > (currentUser?.credits || 0)) {
      setError('Insufficient credits')
      return
    }

    setSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/credits/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          recipientEmail: foundUser.email,
          amount: creditAmount,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        refreshUser() // Refresh current user's credits
        router.push(`/payment/success?amount=${creditAmount}&type=TRANSFER&recipient=${encodeURIComponent(foundUser.name)}`)
        onClose()
      } else {
        setError(data.error || 'Failed to send credits')
      }
    } catch (err) {
      setError('Failed to send credits')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Share Credits</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)]/5 rounded-lg transition-all"
          >
            <X size={20} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Your Balance */}
          <div className="bg-[var(--color-accent)]/10 rounded-xl p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">Your Balance</p>
            <p className="text-2xl font-black text-[var(--color-text-primary)]">{currentUser?.credits || 0} credits</p>
          </div>

          {/* Email Search */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Recipient Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter email address..."
                className="flex-1 px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <button
                onClick={searchUser}
                disabled={searching || !email.trim()}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-accent)]/80 transition-all disabled:opacity-50"
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>
          </div>

          {/* Found User Card */}
          {foundUser && (
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-accent)] rounded-xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)] mb-2">Found User</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-bold">
                  {foundUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">{foundUser.name}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{foundUser.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Amount to Send
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={currentUser?.credits || 0}
              placeholder="Enter amount..."
              className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Message (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              rows={2}
              className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl text-sm focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-sm text-green-500">{success}</p>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || !foundUser || !amount}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-accent)] text-white rounded-xl font-bold hover:bg-[var(--color-accent)]/80 transition-all disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Credits
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
