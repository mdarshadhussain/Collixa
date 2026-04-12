// app/api/intents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { intentService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')

    let intents

    if (status || category) {
      intents = await intentService.filterIntents(status as string, category as string)
    } else {
      intents = await intentService.getIntents()
    }

    return NextResponse.json({ data: intents }, { status: 200 })
  } catch (error) {
    console.error('Error fetching intents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, category, status, budget, timeline, goal, created_by, location } = body

    // Validate input
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    // Embed location into description silently, since "location" column does not exist structurally
    const finalDescription = location ? `${description}\n\nLocation: ${location}` : description;

    const intentPayload: any = {
      title,
      description: finalDescription,
      category: category || 'Other',
      status: status || 'looking',
      budget: budget || '',
      timeline: timeline || '',
      goal: goal || '',
    }
    
    // Only add created_by if it's a valid UUID string
    if (created_by && typeof created_by === 'string' && created_by.trim() !== '') {
      intentPayload.created_by = created_by;
    }

    const intent = await intentService.createIntent(intentPayload as any)

    if (!intent || (intent as any).error) {
      const errorMsg = (intent as any)?.error?.message || JSON.stringify((intent as any)?.error) || 'Failed to create intent'
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Intent created successfully',
        data: intent,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating intent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
