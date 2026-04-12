// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const users = await userService.getUsers()

    return NextResponse.json({ data: users }, { status: 200 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
