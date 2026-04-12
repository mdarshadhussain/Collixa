// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase, userService } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, title, location } = body

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create user profile
    const user = await userService.createUser({
      name,
      email,
      title: title || '',
      location: location || '',
      bio: '',
      avatar_url: '',
      hourly_rate: 0,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
