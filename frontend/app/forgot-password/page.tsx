'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import Button from '@/components/Button'
import Input from '@/components/Input'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        if (process.env.NODE_ENV === 'development' && data.otp) {
          setOtp(data.otp)
        }
      } else {
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-sage-light rounded-lg flex items-center justify-center">
              <span className="text-sage-dark font-bold text-2xl">C</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Collixa</h1>
          </div>
          <p className="text-gray-600 mt-2">Reset Your Password</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-subtle">
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={56} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Email Sent!</h2>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Follow the instructions in the email to reset your password.
              </p>

              {otp && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Development Mode:</strong> Your OTP is <code className="font-bold">{otp}</code>
                  </p>
                </div>
              )}

              <Button
                onClick={() => router.push('/auth')}
                variant="primary"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-sm text-gray-600">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
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
