import CreditTransactionModel from '../models/CreditTransaction.js';

export class CreditService {
  static async getMyTransactions(userId) {
    return await CreditTransactionModel.getByUser(userId);
  }
}

export default CreditService;
