import Stripe from 'stripe';
import CreditService from '../services/CreditService.js';
import { NotificationService } from '../services/NotificationService.js';
import { AchievementService } from '../services/AchievementService.js';
import UserModel from '../models/User.js';
import config from '../config/env.js';
import { supabaseAdmin, supabase } from '../config/database.js';

const stripeSecretKey = config.STRIPE_SECRET_KEY;
let stripe = null;
if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey);
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY is missing. Credit purchase features will not work.');
}

const CREDIT_PACKAGES = {
  'starter': { name: 'Curious Case', credits: 100, price: 500 }, // $5.00
  'pro': { name: 'Collector', credits: 250, price: 1000 },       // $10.00
  'premium': { name: 'Architect', credits: 750, price: 2500 },  // $25.00
  'ultimate': { name: 'The Editorial', credits: 2000, price: 5000 } // $50.00
};

const TIER_RULES = {
  'Nomad': { fee: 0.10, bonus: 0.00 },
  'Architect': { fee: 0.08, bonus: 0.02 },
  'Luminary': { fee: 0.05, bonus: 0.05 },
  'Oracle': { fee: 0.02, bonus: 0.10 }
};

export class CreditController {
  static async getMyTransactions(req, res, next) {
    try {
      const transactions = await CreditService.getMyTransactions(req.user.id);
      res.status(200).json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async createCheckoutSession(req, res, next) {
    try {
      if (!stripe) {
        return res.status(503).json({ success: false, error: 'Payment service is not configured' });
      }
      const { packageId } = req.body;
      const pkg = CREDIT_PACKAGES[packageId];

      if (!pkg) {
        return res.status(400).json({ success: false, error: 'Invalid credit package' });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pkg.credits} Credits - ${pkg.name}`,
                description: `Upgrade your influence in the Intent Marketplace.`,
              },
              unit_amount: pkg.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${config.FRONTEND_URL}/profile?payment=success`,
        cancel_url: `${config.FRONTEND_URL}/profile?payment=cancel`,
        metadata: {
          userId: req.user.id,
          credits: pkg.credits,
          packageId: packageId
        }
      });

      res.status(200).json({ success: true, url: session.url });
    } catch (error) {
      next(error);
    }
  }

  static async simulateSuccess(req, res, next) {
    try {
      const { packageId } = req.body;
      const pkg = CREDIT_PACKAGES[packageId];

      if (!pkg) {
        return res.status(400).json({ success: false, error: 'Invalid credit package' });
      }

      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      const baseCredits = pkg.credits;
      
      // Apply Rank Bonus
      const rule = TIER_RULES[user.tier] || TIER_RULES['Nomad'];
      const bonusCredits = Math.floor(baseCredits * rule.bonus);
      const totalCredits = baseCredits + bonusCredits;

      // Use CreditService for consistent and cleaner logic
      await CreditService.addCredits(userId, totalCredits, 'PURCHASE');

      res.status(200).json({ 
        success: true, 
        message: `Successfully added ${totalCredits} credits (${bonusCredits} rank bonus included)`,
        data: { base: baseCredits, bonus: bonusCredits, total: totalCredits }
      });
    } catch (error) {
      console.error('Simulation update failed:', error);
      next(error);
    }
  }

  static async handleWebhook(req, res, next) {

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Stripe requires the raw body for signature verification.
      const payload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(payload, sig, config.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, credits: baseCreditsStr } = session.metadata;
      const baseCredits = parseInt(baseCreditsStr);

      try {
        const user = await UserModel.findById(userId);
        const rule = TIER_RULES[user.tier] || TIER_RULES['Nomad'];
        const bonusCredits = Math.floor(baseCredits * rule.bonus);
        const totalCredits = baseCredits + bonusCredits;

        await CreditService.addCredits(userId, totalCredits, 'PURCHASE');
        console.log(`✅ Successfully credited ${totalCredits} credits (${bonusCredits} bonus) to user ${userId}`);
      } catch (dbErr) {
        console.error('Database update failed after payment:', dbErr);
        return res.status(500).json({ error: 'Database update failed' });
      }
    }

    res.status(200).json({ received: true });
  }

  /**
   * Share credits with another user by email
   */
  static async shareCredits(req, res, next) {
    try {
      const { recipientEmail, amount, message } = req.body;
      const senderId = req.user.id;
      const senderName = req.user.name;

      // Validate amount
      const creditAmount = parseInt(amount);
      if (!creditAmount || creditAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid credit amount' });
      }

      // Find recipient by email
      const recipient = await UserModel.findByEmail(recipientEmail);
      if (!recipient) {
        return res.status(404).json({ success: false, error: 'User not found with this email' });
      }

      // Cannot send to yourself
      if (recipient.id === senderId) {
        return res.status(400).json({ success: false, error: 'Cannot send credits to yourself' });
      }

      // Check sender has enough credits (including fee)
      const sender = await UserModel.findById(senderId);
      
      const rule = TIER_RULES[sender.tier] || TIER_RULES['Nomad'];
      const feeAmount = Math.ceil(creditAmount * rule.fee);
      const totalDeduction = creditAmount + feeAmount;

      if (!sender || (sender.credits || 0) < totalDeduction) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient pool. Transfer of ${creditAmount} CR requires a ${feeAmount} CR protocol fee (Total: ${totalDeduction} CR).` 
        });
      }

      // Deduct total (amount + fee) from sender
      await CreditService.deductCredits(senderId, totalDeduction, 'TRANSFER');

      // Add only the requested amount to recipient
      await CreditService.addCredits(recipient.id, creditAmount, 'TRANSFER');

      // Record transfer transaction
      const client = supabaseAdmin || supabase;
      await client.from('credit_transfers').insert([{
        sender_id: senderId,
        recipient_id: recipient.id,
        amount: creditAmount,
        fee_amount: feeAmount,
        message: message || null
      }]);

      // Notify recipient
      await NotificationService.send(
        recipient.id,
        'CREDIT_RECEIVED',
        'Credits Received',
        `${senderName} sent you ${creditAmount} credits${message ? `: "${message}"` : ''}`,
        '/profile'
      );

      // Notify sender
      await NotificationService.send(
        senderId,
        'CREDIT_SENT',
        'Credits Sent',
        `You sent ${creditAmount} credits to ${recipient.name}. A fee of ${feeAmount} credits was applied.`,
        '/profile'
      );

      const LevelService = (await import('../services/LevelService.js')).default;
      await LevelService.awardXP(senderId, Math.floor(creditAmount * 0.5), 'Credit Sharing');

      AchievementService.checkAndAwardAchievements(senderId).catch(console.error);
      AchievementService.checkAndAwardAchievements(recipient.id).catch(console.error);

      res.status(200).json({
        success: true,
        message: `Successfully shared ${creditAmount} credits (${feeAmount} fee applied)`,
        data: {
          recipient: { name: recipient.name, email: recipient.email },
          amount: creditAmount,
          fee: feeAmount,
          total: totalDeduction,
          rate: rule.fee * 100
        }
      });
    } catch (error) {
      console.error('Share credits error:', error);
      next(error);
    }
  }

  /**
   * Search user by email (for credit sharing)
   */
  static async searchUserByEmail(req, res, next) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Return limited info
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CreditController;
