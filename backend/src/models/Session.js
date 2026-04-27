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
    try {
      const { data, error } = await getClient()
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Handle missing columns in schema surgically
        if (error.message && (error.message.includes("in the schema cache") || error.message.includes("does not exist"))) {
           const match = error.message.match(/column "(.*?)"/i) || error.message.match(/column '(.*?)'/i);
           const missingColumn = match ? match[1] : null;
           
           if (missingColumn && updates[missingColumn] !== undefined) {
             console.warn(`[SessionModel] Stripping missing column from update: ${missingColumn}`);
             const { [missingColumn]: _, ...remainingUpdates } = updates;
             
             // Removed the automatic fallback to COMPLETED status.
             // We now strictly honor the confirmation flags once the columns are added.
             return this.update(id, remainingUpdates); // Recursive retry
           }
        }
        throw new Error(`Failed to update session: ${error.message}`);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }
}

export default SessionModel;
