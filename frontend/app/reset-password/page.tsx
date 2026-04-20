'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/Button'
import Input from '@/components/Input'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!otp || otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter'
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain at least one number'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required. Please use the reset link from your email.')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth')
        }, 2000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-4">
            This password reset link is invalid or has expired.
          </p>
          <Button
            onClick={() => router.push('/forgot-password')}
            variant="primary"
          >
            Request New Link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sage-light rounded-lg flex items-center justify-center">
              <span className="text-sage-dark font-bold text-2xl">C</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Collixa</h1>
          </div>
          <p className="text-gray-600 mt-2">Create New Password</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-gray-100 rounded-lg p-8 shadow-subtle">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={56} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
              <p className="text-gray-600">
                Your password has been successfully reset.
              </p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-sm text-gray-600">
                  Enter the OTP from your email and create a new password.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* OTP */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(value)
                      if (errors.otp) setErrors({ ...errors, otp: '' })
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-light focus:bg-[var(--color-bg-secondary)] text-center text-2xl font-bold tracking-widest transition-all ${
                      errors.otp ? 'border-red-300' : 'border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {errors.otp && (
                    <p className="text-sm text-red-500 font-semibold mt-2">{errors.otp}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (errors.newPassword) setErrors({ ...errors, newPassword: '' })
                      }}
                      placeholder="SecurePass123"
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-light focus:bg-[var(--color-bg-secondary)] transition-all ${
                        errors.newPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-red-500 font-semibold mt-2">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                      }}
                      placeholder="SecurePass123"
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-sage-light focus:bg-[var(--color-bg-secondary)] transition-all ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500 font-semibold mt-2">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>

              <button
                onClick={() => router.push('/auth')}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <ArrowLeft size={18} />
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[var(--color-bg-secondary)] flex items-center justify-center">
          <span className="text-sage-dark font-serif italic text-2xl animate-pulse">Establishing secure link...</span>
       </div>
    }>
       <ResetPasswordContent />
    </Suspense>
  )
}
