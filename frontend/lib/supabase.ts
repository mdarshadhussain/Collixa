// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Types for Supabase
export interface User {
  id: string
  name: string
  email: string
  role?: 'USER' | 'VERIFIED_USER' | 'ADMIN' | string
  title?: string
  location?: string
  bio?: string
  avatar_url?: string
  hourly_rate?: number
  credits?: number
  xp?: number
  level?: number
  tier?: string
  is_genesis_completed?: boolean
  is_verified?: boolean
  age?: string | number
  gender?: string
  interests?: string[]
  target_goal?: string
  cached_roadmap?: any
  avg_rating?: number
  total_reviews?: number
  created_at?: string
  updated_at?: string
}

export interface Intent {
  id: string | number
  title: string
  description?: string
  category?: string
  location?: string
  status: 'looking' | 'in_progress' | 'completed' | 'rejected' | 'pending'
  budget?: string
  timeline?: string
  goal?: string
  collaborator_id?: string
  creator_confirmed_at?: string
  collaborator_confirmed_at?: string
  created_by: string | { id: string; name: string; email: string; avatar_url?: string; level?: number }
  created_at?: string
  updated_at?: string
  attachment_name?: string
  rejection_reason?: string
  accepted_count?: number
  request_count?: number
  collaborators?: User[]
  collaborator_limit?: number
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: string
  content: string
  type: 'text' | 'location' | 'system' | 'image'
  metadata?: any
  created_at: string
}

export interface Conversation {
  id: number
  participant_1?: string
  participant_2?: string
  type: 'DIRECT' | 'GROUP'
  title?: string
  admin_id?: string
  intent_id?: number
  status?: string
  last_message?: string
  updated_at: string
}

// User Functions
export const userService = {
  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user by email:', error)
      return null
    }

    return data as User
  },

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

  // Filter intents
  async filterIntents(status?: string, category?: string): Promise<Intent[]> {
    let query = supabase.from('intents').select().order('created_at', { ascending: false })
    
    if (status && status !== 'All') {
      query = query.eq('status', status.toLowerCase())
    }
    
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error filtering intents:', error)
      return []
    }
    
    return data as Intent[]
  },


  // Get intent by ID using Backend API
  async getIntentById(id: string | number): Promise<Intent | null> {
    try {
      const response = await fetch(`${API_URL}/api/intents/${id}`)
      const data = await response.json()
      
      if (response.ok && data.data) {
        return data.data
      }
      return null
    } catch (err) {
      console.error('Error fetching intent by ID:', err)
      return null
    }
  },

  // Check if user already requested
  async getExistingRequest(userId: string, intentId: string): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/${intentId}/request/status?userId=${userId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      return await response.json()
    } catch (err) {
      console.error('Error checking existing request:', err)
      return { data: null }
    }
  },

  // Request to join an intent (Approval flow)
  async requestToJoin(intentId: string | number): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/${intentId}/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send request')
      }

      return await response.json()
    } catch (err) {
      console.error('Error requesting to join:', err)
      throw err
    }
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

  // Confirm completion of an intent
  async confirmCompletion(intentId: string | number): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/${intentId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to confirm completion')
      }

      return await response.json()
    } catch (err) {
      console.error('Error confirming completion:', err)
      throw err
    }
  },

  // Get collaboration requests for an intent
  async getCollaborationRequests(intentId: string | number): Promise<any[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/${intentId}/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      return data.data || []
    } catch (err) {
      console.error('Error fetching collaboration requests:', err)
      return []
    }
  },

  // Accept a collaboration request
  async acceptCollaborationRequest(requestId: string | number): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/requests/${requestId}/accept`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept request')
      }

      return await response.json()
    } catch (err) {
      console.error('Error accepting request:', err)
      throw err
    }
  },

  // Reject a collaboration request
  async rejectCollaborationRequest(requestId: string | number): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/requests/${requestId}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject request')
      }

      return await response.json()
    } catch (err) {
      console.error('Error rejecting request:', err)
      throw err
    }
  },

  // Get pending collaboration requests for current user's intents
  async getPendingActions(): Promise<any[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/intents/actions/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      return data.data || []
    } catch (err) {
      console.error('Error fetching pending actions:', err)
      return []
    }
  },

  // Get accepted collaborators for an intent
  async getCollaborators(intentId: string | number): Promise<any[]> {
    try {
      const response = await fetch(`${API_URL}/api/intents/${intentId}/collaborators`)
      const data = await response.json()
      return data.data || []
    } catch (err) {
      console.error('Error fetching collaborators:', err)
      return []
    }
  },
}

// Message Functions
export const messageService = {
  // Get conversation messages
  async getMessages(conversationId: number, userId?: string): Promise<(Message & { sender?: User })[]> {
    // 1. Get user's history_cleared_at for this conversation if userId is provided
    let historyClearedAt: string | null = null;
    
    if (userId) {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('history_cleared_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (participant?.history_cleared_at) {
        historyClearedAt = participant.history_cleared_at;
      }
    }

    // 2. Fetch messages
    let query = supabase
      .from('messages')
      .select('*, sender_id(id, name, avatar_url)')
      .eq('conversation_id', conversationId);
    
    if (historyClearedAt) {
      query = query.gt('created_at', historyClearedAt);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data as any[]
  },

  // Send message via Backend API to trigger notifications
  async sendMessage(
    conversationId: number,
    senderId: string,
    content: string,
    type: 'text' | 'location' | 'system' | 'image' = 'text',
    metadata: any = null
  ): Promise<Message | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId, content, type, metadata })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        return data.data
      }
      return null
    } catch (err) {
      console.error('Error sending message via backend:', err)
      // Fallback to direct Supabase if backend fails (though notifications won't trigger)
      const { data, error } = await supabase
        .from('messages')
        .insert([{ conversation_id: conversationId, sender_id: senderId, content, type, metadata }])
        .select()
        .single()
      return data as Message
    }
  },

  // Get total unread count from backend
  async getUnreadCount(): Promise<number> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      return data.count || 0
    } catch (err) {
      console.error('Error fetching unread count:', err)
      return 0
    }
  },

  // Mark conversation as read
  async markAsRead(conversationId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/${conversationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.ok
    } catch (err) {
      console.error('Error marking as read:', err)
      return false
    }
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

  async scheduleMeeting(conversationId: number, title: string, scheduledAt: string, durationMinutes: number = 30): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/meetings/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId, title, scheduledAt, durationMinutes })
      })
      return await response.json()
    } catch (err) {
      console.error('Error scheduling meeting:', err)
      return { success: false, error: 'Failed to schedule meeting' }
    }
  },

  /**
   * Get or create a direct conversation between two users
   */
  async getOrCreateDirectConversation(userId1: string, userId2: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/conversations/direct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: userId2 })
      })
      const result = await response.json()
      if (result.success) return result.data
      throw new Error(result.error || 'Failed to initialize chat')
    } catch (err) {
      console.error('Error in getOrCreateDirectConversation:', err)
      return null
    }
  }
}

// Conversation Functions
export const conversationService = {
  // Get user conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1(id, name, avatar_url),
        participant_2(id, name, avatar_url),
        conversation_participants!inner(user_id)
      `)
      .eq('conversation_participants.user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data as any[]
  },

  // Find or create direct conversation between two users
  async getOrCreateDirectConversation(user1: string, user2: string): Promise<Conversation | null> {
    if (!user1 || !user2) {
      throw new Error('User IDs are required to start a conversation.');
    }

    // Check if exists
    // We use a simpler OR query or separate checks if needed, but standard .or should work if syntax is clean
    const { data: existing, error: lookupError } = await supabase
      .from('conversations')
      .select('*')
      .eq('type', 'DIRECT')
      .or(`and(participant_1.eq.${user1},participant_2.eq.${user2}),and(participant_1.eq.${user2},participant_2.eq.${user1})`)
      .maybeSingle()

    if (lookupError) {
      console.error('Chat lookup error:', lookupError)
      // If the complex .or fails, we could fallback, but let's see the error first
      throw new Error(`Database lookup failed: ${lookupError.message}`);
    }

    if (existing) return existing as Conversation

    // Create new. Direct chats are implicitly accepted when created here.
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        participant_1: user1,
        participant_2: user2,
        type: 'DIRECT'
      }])
      .select()
      .single()

    if (error) {
      console.error('Chat creation error:', error)
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    // Add participants to participants table
    const { error: partError } = await supabase.from('conversation_participants').insert([
      { conversation_id: data.id, user_id: user1 },
      { conversation_id: data.id, user_id: user2 }
    ])

    if (partError) {
      console.error('Participant insert error:', partError)
    }

    return data as Conversation
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

  // Leave a conversation (removes from mapped participants but preserves chat)
  async leaveConversation(conversationId: number, userId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      // Important: We call the backend DELETE /participants endpoint so that DIRECT chats get fully deleted
      const response = await fetch(`${API_URL}/api/chat/${conversationId}/participants/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.ok
    } catch (err) {
      console.error('Error leaving conversation:', err)
      return false
    }
  },

  // Accept a chat request (Legacy - if status ever added back)
  async acceptMessageRequest(conversationId: number): Promise<boolean> {
    return true
  },

  // Clear all messages in a conversation
  async clearChat(conversationId: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/${conversationId}/clear`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.ok
    } catch (err) {
      console.error('Error clearing chat:', err)
      return false
    }
  },

  // Delete an entire conversation
  async deleteConversation(conversationId: number): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      return false
    }

    return true
  },

  // Update participant role
  async updateParticipantRole(conversationId: number, userId: string, role: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/${conversationId}/participants/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role })
      })
      return response.ok
    } catch (err) {
      console.error('Error updating participant role:', err)
      return false
    }
  },

  // Remove participant
  async removeParticipant(conversationId: number, userId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/chat/${conversationId}/participants/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.ok
    } catch (err) {
      console.error('Error removing participant:', err)
      return false
    }
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
   * Upload a file to the attachments bucket via Backend Proxy
   */
  async uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required for upload');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      formData.append('bucket', bucket);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/storage/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      // Return full public URL
      return this.getPublicUrl(data.path);
    } catch (error) {
      console.error('Error uploading file via proxy:', error);
      return null;
    }
  }
}

/**
 * Skill Exchange System Service
 */
export const skillService = {
  /**
   * List all available skills with filters
   */
  async getSkills(search?: string, category?: string, sortBy?: string) {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category && category !== 'All') params.append('category', category)
      if (sortBy) params.append('sortBy', sortBy)
      
      const response = await fetch(`${API_URL}/api/skills?${params.toString()}`)
      return await response.json()
    } catch (err) {
      console.error('Error fetching skills:', err)
      return { success: false, data: [] }
    }
  },

  /**
   * Get skill details by ID
   */
  async getSkillDetail(id: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return await response.json()
    } catch (err) {
      console.error('Error fetching skill detail:', err)
      return { success: false, error: 'Failed to fetch skill details' }
    }
  },

  /**
   * Post a notice to a tribe
   */
  async createNotice(skillId: string, content: string, type: string = 'info') {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/${skillId}/notices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, type })
      })
      return await response.json()
    } catch (err) {
      console.error('Error posting notice:', err)
      return { success: false, error: 'Failed to post notice' }
    }
  },

  /**
   * Delete a notice
   */
  async deleteNotice(noticeId: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/notices/${noticeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return await response.json()
    } catch (err) {
      console.error('Error deleting notice:', err)
      return { success: false, error: 'Failed to delete notice' }
    }
  },

  /**
   * Add a new skill for current user
   */
  async addSkill(skillData: any) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      })
      return await response.json()
    } catch (err) {
      console.error('Error adding skill:', err)
      return { success: false, error: 'Failed to add skill' }
    }
  },

  /**
   * Update an existing skill
   */
  async updateSkill(skillId: string, skillData: any) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/${skillId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(skillData)
      })
      return await response.json()
    } catch (err) {
      console.error('Error updating skill:', err)
      return { success: false, error: 'Failed to update skill' }
    }
  },

  /**
   * Delete a skill
   */
  async deleteSkill(skillId: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/${skillId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return await response.json()
    } catch (err) {
      console.error('Error deleting skill:', err)
      return { success: false, error: 'Failed to delete skill' }
    }
  },

  /**
   * Request a skill exchange
   */
  async requestExchange(exchangeData: { skillId: string, message?: string }) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(exchangeData)
      })
      return await response.json()
    } catch (err) {
      console.error('Error requesting exchange:', err)
      return { success: false, error: 'Failed to request exchange' }
    }
  }
  ,
  /**
   * Get current user's skill exchanges
   */
  async getMyExchanges() {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/exchanges/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return await response.json()
    } catch (err) {
      console.error('Error fetching exchanges:', err)
      return { success: false, data: [] }
    }
  },

  /**
   * Get incoming requests (Alias for getMyExchanges for consistent expert dashboard API)
   */
  async getIncomingRequests() {
    return this.getMyExchanges()
  },

  /**
   * Get sessions for the expert (Alias for sessionService.getMySessions)
   */
  async getUserSessions() {
    return sessionService.getMySessions()
  },

  /**
   * Provider accepts/rejects exchange request
   */
  async updateExchangeStatus(exchangeId: string, status: 'ACCEPTED' | 'REJECTED' | 'SCHEDULED' | 'PENDING') {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/skills/exchanges/${exchangeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      return await response.json()
    } catch (err) {
      console.error('Error updating exchange:', err)
      return { success: false, error: 'Failed to update exchange status' }
    }
  }
}

export const sessionService = {
  async scheduleSession(payload: { requestId: string; scheduledTime: string; meetingLink?: string }) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      return await response.json()
    } catch (err) {
      console.error('Error scheduling session:', err)
      return { success: false, error: 'Failed to schedule session' }
    }
  },

  async getMySessions() {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return await response.json()
    } catch (err) {
      console.error('Error fetching sessions:', err)
      return { success: false, data: [] }
    }
  },

  async completeSession(sessionId: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/sessions/${sessionId}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return await response.json()
    } catch (err) {
      console.error('Error completing session:', err)
      return { success: false, error: 'Failed to complete session' }
    }
  },

  async completeRecurringSession(exchangeId: string, scheduledTime: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/sessions/recurring/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ exchangeId, scheduledTime })
      })
      return await response.json()
    } catch (err) {
      console.error('Error completing recurring session:', err)
      return { success: false, error: 'Failed to complete recurring session' }
    }
  }
}

export const creditService = {
  async getMyTransactions() {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/credits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      return data.data || []
    } catch (err) {
      console.error('Error fetching transactions:', err)
      return []
    }
  },

  async createCheckoutSession(packageId: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/credits/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId })
      })
      return await response.json()
    } catch (err) {
      console.error('Error creating checkout session:', err)
      return { success: false, error: 'Failed to initiate checkout' }
    }
  },

  async simulateSuccess(packageId: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/credits/simulate-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ packageId })
      })
      return await response.json()
    } catch (err) {
      console.error('Error simulating success:', err)
      return { success: false, error: 'Failed to simulate purchase' }
    }
  },

  async shareCredits(recipientEmail: string, amount: number, message?: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/credits/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipientEmail, amount, message })
      })
      return await response.json()
    } catch (err) {
      console.error('Error sharing credits:', err)
      return { success: false, error: 'Failed to share credits' }
    }
  },

  async searchUserByEmail(email: string) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/credits/search-user?email=${email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return await response.json()
    } catch (err) {
      console.error('Error searching user:', err)
      return { success: false, error: 'Failed to find user' }
    }
  }
}

export const reviewService = {
  async submitReview(payload: { sessionId: string; rating: number; comment?: string }) {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      return await response.json()
    } catch (err) {
      console.error('Error submitting review:', err)
      return { success: false, error: 'Failed to submit review' }
    }
  }
}

