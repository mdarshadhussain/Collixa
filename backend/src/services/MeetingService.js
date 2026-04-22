import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class MeetingService {
  static async createMeeting(conversationId, creatorId, title, scheduledAt, durationMinutes = 30) {
    const roomName = `collixa-meeting-${conversationId}-${Date.now()}`;
    
    const { data: meeting, error } = await getClient()
      .from('meetings')
      .insert([{
        conversation_id: conversationId,
        creator_id: creatorId,
        title,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        room_name: roomName,
        status: 'SCHEDULED'
      }])
      .select()
      .single();

    if (error) throw error;
    return meeting;
  }

  static async getMeetings(conversationId) {
    const { data, error } = await getClient()
      .from('meetings')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}

export default MeetingService;
