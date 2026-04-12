// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for Supabase
export interface User {
  id: string
  name: string
  email: string
  title?: string
  location?: string
  bio?: string
  avatar_url?: string
  hourly_rate?: number
  created_at?: string
}

export interface Intent {
  id: string | number
  title: string
  description?: string
  category?: string
  location?: string
  status: 'looking' | 'in_progress' | 'completed'
  budget?: string
  timeline?: string
  goal?: string
  created_by: string | { id: string; name: string; email: string; avatar_url?: string }
  created_at?: string
  updated_at?: string
  attachment_name?: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  created_at: string
}

export interface Conversation {
  id: number
  participant_1: string
  participant_2: string
  last_message?: string
  updated_at: string
}

// User Functions
export const userService = {
  // Get user by ID
  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data as User
  },

  // Get all users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select()

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data as User[]
  },

  // Create user
  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data as User
  },

  // Update user
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data as User
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return false
    }

    return true
  },
}

// Intent Functions
export const intentService = {
  // Get all intents
  async getIntents(): Promise<Intent[]> {
    const { data, error } = await supabase
      .from('intents')
      .select()
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching intents:', error)
      return []
    }

    return data as Intent[]
  },

  // Get intent by ID
  async getIntent(id: number): Promise<Intent | null> {
    const { data, error } = await supabase
      .from('intents')
      .select()
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching intent:', error)
      return null
    }

    return data as Intent
  },

  // Get intents by user
  async getUserIntents(userId: string): Promise<Intent[]> {
    const { data, error } = await supabase
      .from('intents')
      .select()
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user intents:', error)
      return []
    }

    return data as Intent[]
  },

  // Create intent
  async createIntent(intent: Omit<Intent, 'id' | 'created_at' | 'updated_at'>): Promise<Intent | null> {
    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase;

    const { data, error } = await supabaseAdmin
      .from('intents')
      .insert([intent])
      .select()
      .single()

    if (error) {
      console.error('Error creating intent:', error)
      return { error } as any
    }

    return data as Intent
  },

  // Update intent
  async updateIntent(id: number, updates: Partial<Intent>): Promise<Intent | null> {
    const { data, error } = await supabase
      .from('intents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating intent:', error)
      return null
    }

    return data as Intent
  },

  // Delete intent
  async deleteIntent(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('intents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting intent:', error)
      return false
    }

    return true
  },

  // Filter intents
  async filterIntents(status?: string, category?: string): Promise<Intent[]> {
    let query = supabase.from('intents').select()

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error filtering intents:', error)
      return []
    }

    return data as Intent[]
  },
}

// Message Functions
export const messageService = {
  // Get conversation messages
  async getMessages(conversationId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data as Message[]
  },

  // Send message
  async sendMessage(
    conversationId: number,
    senderId: string,
    content: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ conversation_id: conversationId, sender_id: senderId, content }])
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return null
    }

    return data as Message
  },

  // Delete message
  async deleteMessage(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting message:', error)
      return false
    }

    return true
  },
}

// Conversation Functions
export const conversationService = {
  // Get user conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, participant_1(id, name, avatar_url), participant_2(id, name, avatar_url)')
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data as any[] // Temporarily typecast as any[] effectively covering the joined nested fields
  },

  // Create conversation
  async createConversation(participant1: string, participant2: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ participant_1: participant1, participant_2: participant2 }])
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data as Conversation
  },

  // Update conversation
  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      return null
    }

    return data as Conversation
  },
}

// Storage Functions
export const storageService = {
  /**
   * Get public URL for a file in the attachments bucket
   */
  getPublicUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already a URL
    
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);
    
    return data.publicUrl;
  },

  /**
   * Upload a file to the attachments bucket
   */
  async uploadFile(file: File, path: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    return data.path;
  }
}

