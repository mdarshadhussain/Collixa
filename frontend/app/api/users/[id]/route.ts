// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await userService.getUser(params.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: user }, { status: 200 })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const user = await userService.updateUser(params.id, body)

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'User updated successfully',
        data: user,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await userService.deleteUser(params.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
