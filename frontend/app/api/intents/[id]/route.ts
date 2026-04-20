// app/api/intents/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { intentService } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid intent ID' },
        { status: 400 }
      )
    }

    const intent = await intentService.getIntentById(id)

    if (!intent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: intent }, { status: 200 })
  } catch (error) {
    console.error('Error fetching intent:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intent' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid intent ID' },
        { status: 400 }
      )
    }

    const intent = await intentService.updateIntent(id, body)

    if (!intent) {
      return NextResponse.json(
        { error: 'Failed to update intent' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Intent updated successfully',
        data: intent,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating intent:', error)
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
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid intent ID' },
        { status: 400 }
      )
    }

    const success = await intentService.deleteIntent(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete intent' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Intent deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
