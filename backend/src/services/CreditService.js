import { supabase, supabaseAdmin } from '../config/database.js';
import CreditTransactionModel from '../models/CreditTransaction.js';

const getClient = () => supabaseAdmin || supabase;

export class CreditService {
  static async getMyTransactions(userId) {
    return await CreditTransactionModel.getByUser(userId);
  }

  /**
   * Add credits to a user and record the transaction
   * @param {string} userId - ID of the user
   * @param {number} amount - Amount of credits to add
   * @param {string} type - Transaction type (PURCHASE, EARN)
   * @param {string} sessionId - Optional UUID of a session if related to a collaboration
   * @returns {Promise<Object>} The updated transaction record
   */
  static async addCredits(userId, amount, type, sessionId = null) {
    try {
      // 1. Record the transaction
      const [transaction] = await CreditTransactionModel.createMany([{
        user_id: userId,
        amount: parseInt(amount),
        type: type,
        session_id: sessionId,
        created_at: new Date().toISOString()
      }]);

      if (!transaction) throw new Error('Failed to create credit transaction record');

      // 2. Fetch current user credits
      const { data: user, error: fetchError } = await getClient()
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // 3. Update user credits
      const newBalance = (user.credits || 0) + parseInt(amount);
      const { error: updateError } = await getClient()
        .from('users')
        .update({ credits: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      return transaction;
    } catch (error) {
      console.error('Error in CreditService.addCredits:', error.message);
      throw error;
    }
  }
}

export default CreditService;
