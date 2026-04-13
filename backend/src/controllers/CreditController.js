import CreditService from '../services/CreditService.js';

export class CreditController {
  static async getMyTransactions(req, res, next) {
    try {
      const transactions = await CreditService.getMyTransactions(req.user.id);
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }
}

export default CreditController;
