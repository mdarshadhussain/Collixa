import { supabase, supabaseAdmin } from '../config/database.js';

const getClient = () => supabaseAdmin || supabase;

export class CreditTransactionModel {
  static async createMany(transactions) {
    const { data, error } = await getClient()
      .from('credit_transactions')
      .insert(transactions)
      .select();

    if (error) throw new Error(`Failed to create credit transactions: ${error.message}`);
    return data || [];
  }

  static async getByUser(userId) {
    const { data, error } = await getClient()
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch credit transactions: ${error.message}`);
    return data || [];
  }
}

export default CreditTransactionModel;
