// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'VERIFIED_USER' | 'ADMIN'
  avatar_url?: string
  bio?: string
  location?: string
  is_verified?: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  pendingEmail: string | null
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (email: string, password: string, name: string) => Promise<{ error: string | null; pendingVerification?: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Check if user is logged in on mount (restore from localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token')

        if (savedToken) {
          // Verify token with backend
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setToken(savedToken)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('auth_token')
          }
        }
      } catch (error) {
        console.error('Auth check error:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('auth_token', data.token)
        return { error: null }
      } else {
        return { error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { error: 'Login failed' }
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store email for OTP verification
        setPendingEmail(email)
        // Don't set user/token yet, user needs to verify OTP first
        return { error: null, pendingVerification: true }
      } else {
        return { error: data.error || 'Registration failed' }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { error: 'Registration failed' }
    }
  }

  const logout = async () => {
    try {
      const currentToken = token || localStorage.getItem('auth_token')
      
      if (currentToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        })
      }

      setUser(null)
      setToken(null)
      localStorage.removeItem('auth_token')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if logout fails
      setUser(null)
      setToken(null)
      localStorage.removeItem('auth_token')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        pendingEmail,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
