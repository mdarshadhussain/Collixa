// app/context/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, User, API_URL } from '@/lib/supabase'

// Admin emails configuration
const ADMIN_EMAILS = ['admin@collixa.space']

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  viewMode: 'admin' | 'user'
  pendingEmail: string | null
  login: (email: string, password: string) => Promise<{ error: string | null; pendingVerification?: boolean; otp?: string }>
  register: (email: string, password: string, name: string) => Promise<{ error: string | null; pendingVerification?: boolean; otp?: string }>
  logout: () => Promise<void>
  loginWithGoogle: () => Promise<{ error: string | null }>
  loginWithFacebook: () => Promise<{ error: string | null }>
  refreshUser: () => Promise<void>
  updateUser: (updatedUser: User) => void
  toggleViewMode: () => void
  setViewMode: (mode: 'admin' | 'user') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [viewMode, setViewModeState] = useState<'admin' | 'user'>('user')

  // Check if user is logged in on mount and listen to changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('auth_token', session.access_token);
        
        try {
          console.log('[AuthContext] Fetching profile from:', `${API_URL}/api/auth/profile`);
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('[AuthContext] Profile fetch successful:', data.user?.email);
            setUser(data.user);
            // Check if user is admin
            const adminStatus = ADMIN_EMAILS.includes(data.user.email);
            setIsAdmin(adminStatus);
            // Restore view mode from localStorage for admins
            if (adminStatus) {
              const savedViewMode = localStorage.getItem('collixa_view_mode') as 'admin' | 'user';
              if (savedViewMode) {
                setViewModeState(savedViewMode);
              }
            }
          } else {
            const errorText = await response.text();
            console.error(`[AuthContext] Profile fetch failed (${response.status}):`, errorText);
            
            // Fallback: If session exists but profile fetch fails, create a minimal user
            // to prevent the redirection loop while we debug the backend/DB.
            console.warn('[AuthContext] Using fallback user from session');
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: 'USER',
              xp: 0,
              level: 1,
              is_verified: true
            } as any);
          }
        } catch (err) {
          console.error('[AuthContext] Fatal error during profile fetch:', err);
          // Fallback also here
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: 'User',
            role: 'USER'
          } as any);
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

  const login = async (email: string, password: string): Promise<{ error: string | null; pendingVerification?: boolean; otp?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      return { error: 'Login failed' };
    }
  }

  const register = async (email: string, password: string, name: string): Promise<{ error: string | null; pendingVerification?: boolean; otp?: string }> => {
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
        setLoading(false);
        return { error: error.message };
      }

      setPendingEmail(email);
      return { error: null, pendingVerification: true };
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      return { error: 'Registration failed' };
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setViewModeState('user');
      localStorage.removeItem('collixa_view_mode');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const toggleViewMode = () => {
    const newMode = viewMode === 'admin' ? 'user' : 'admin';
    setViewModeState(newMode);
    localStorage.setItem('collixa_view_mode', newMode);
  }

  const setViewMode = (mode: 'admin' | 'user') => {
    setViewModeState(mode);
    localStorage.setItem('collixa_view_mode', mode);
  }

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Google login error:', err);
      return { error: 'Google login failed' };
    } finally {
      setLoading(false);
    }
  }

  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Facebook login error:', err);
      return { error: 'Facebook login failed' };
    } finally {
      setLoading(false);
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
        isAdmin,
        viewMode,
        pendingEmail,
        login,
        register,
        logout,
        loginWithGoogle,
        loginWithFacebook,
        refreshUser,
        updateUser,
        toggleViewMode,
        setViewMode,
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
