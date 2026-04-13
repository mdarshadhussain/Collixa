import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class SessionModel {
  static getClient() {
    return getClient();
  }

  static async create(sessionData) {
    const { data, error } = await getClient()
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data;
  }

  static async getById(id) {
    const { data, error } = await getClient()
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Session not found: ${error.message}`);
    return data;
  }

  static async getByUser(userId) {
    const { data, error } = await getClient()
      .from('sessions')
      .select(`
        *,
        exchange:skill_exchanges(
          id,
          status,
          requester_id,
          provider_id,
          skill:skills(name, category)
        )
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('scheduled_time', { ascending: true });

    if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);
    return data || [];
  }

  static async update(id, updates) {
    const { data, error } = await getClient()
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return data;
  }
}

export default SessionModel;
