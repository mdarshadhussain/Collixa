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
      // 1. Record the transaction (only include session_id if provided)
      const transactionData = {
        user_id: userId,
        amount: parseInt(amount),
        type: type,
        created_at: new Date().toISOString()
      };
      if (sessionId) transactionData.session_id = sessionId;

      const [transaction] = await CreditTransactionModel.createMany([transactionData]);

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

  /**
   * Deduct credits from a user and record the transaction
   * @param {string} userId - ID of the user
   * @param {number} amount - Amount of credits to deduct
   * @param {string} type - Transaction type (TRANSFER, ADMIN_DEDUCT, etc.)
   * @returns {Promise<Object>} The updated transaction record
   */
  static async deductCredits(userId, amount, type) {
    try {
      // 1. Record the transaction (negative amount)
      const [transaction] = await CreditTransactionModel.createMany([{
        user_id: userId,
        amount: -parseInt(amount),
        type: type,
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

      // 3. Update user credits (ensure not negative)
      const newBalance = Math.max(0, (user.credits || 0) - parseInt(amount));
      const { error: updateError } = await getClient()
        .from('users')
        .update({ credits: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      return transaction;
    } catch (error) {
      console.error('Error in CreditService.deductCredits:', error.message);
      throw error;
    }
  }
}

export default CreditService;
