// app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { messageService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      )
    }

    const messages = await messageService.getMessages(parseInt(conversationId))

    return NextResponse.json({ data: messages }, { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversation_id, sender_id, content } = body

    // Validate input
    if (!conversation_id || !sender_id || !content) {
      return NextResponse.json(
        { error: 'conversation_id, sender_id, and content are required' },
        { status: 400 }
      )
    }

    const message = await messageService.sendMessage(
      conversation_id,
      sender_id,
      content
    )

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Message sent successfully',
        data: message,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
