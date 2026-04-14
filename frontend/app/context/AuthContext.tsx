// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'VERIFIED_USER' | 'ADMIN'
  avatar_url?: string
  bio?: string
  location?: string
  credits?: number
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
  refreshUser: () => Promise<void>
  updateUser: (updatedUser: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  // Check if user is logged in on mount and listen to changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('auth_token', session.access_token);
        
        // Fetch profile from public.users
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Login error:', err);
      return { error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) {
        return { error: error.message };
      }

      setPendingEmail(email);
      return { error: null, pendingVerification: true };
    } catch (err) {
      console.error('Registration error:', err);
      return { error: 'Registration failed' };
    } finally {
      setLoading(false);
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const refreshUser = async () => {
    const sessionToken = token || localStorage.getItem('auth_token');
    if (!sessionToken) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
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
        refreshUser,
        updateUser,
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
