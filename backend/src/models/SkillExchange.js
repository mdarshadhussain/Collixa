import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class SkillExchangeModel {
  static getClient() {
    return getClient();
  }

  /**
   * Create a new skill exchange request
   */
  static async createRequest(requestData) {
    const { data, error } = await getClient()
      .from('skill_exchanges')
      .insert([requestData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create exchange request: ${error.message}`);
    return data;
  }

  /**
   * Get exchanges where user is requester or provider
   */
  static async getByUser(userId) {
    const { data, error } = await getClient()
      .from('skill_exchanges')
      .select(`
        *,
        skill:skills(name, category),
        requester:users!skill_exchanges_requester_id_fkey(id, name, avatar_url),
        provider:users!skill_exchanges_provider_id_fkey(id, name, avatar_url)
      `)
      .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch exchanges: ${error.message}`);
    return data || [];
  }

  /**
   * Update request status
   */
  static async updateStatus(id, status, additionalData = {}) {
    const { data, error } = await getClient()
      .from('skill_exchanges')
      .update({ status, ...additionalData })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update status: ${error.message}`);
    return data;
  }
}

export default SkillExchangeModel;
