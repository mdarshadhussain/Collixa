// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase, userService } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Get user profile
    const user = await userService.getUser(authData.user!.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        message: 'Login successful',
        user,
        accessToken: authData.session?.access_token,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
