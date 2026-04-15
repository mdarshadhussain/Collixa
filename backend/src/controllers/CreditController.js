import Stripe from 'stripe';
import CreditService from '../services/CreditService.js';
import config from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';

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
      const credits = pkg.credits;

      // Use CreditService for consistent and cleaner logic
      await CreditService.addCredits(userId, credits, 'PURCHASE');

      res.status(200).json({ success: true, message: `Successfully added ${credits} credits` });
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
      // We use req.rawBody which is captured in server.js via the express.json verify callback.
      const payload = req.rawBody || req.body;
      event = stripe.webhooks.constructEvent(payload, sig, config.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, credits } = session.metadata;

      try {
        // Use CreditService for consistent and cleaner logic
        await CreditService.addCredits(userId, credits, 'PURCHASE');
        console.log(`✅ Successfully credited ${credits} credits to user ${userId}`);
      } catch (dbErr) {
        console.error('Database update failed after payment:', dbErr);
        // Stripe will retry if we return 500
        return res.status(500).json({ error: 'Database update failed' });
      }
    }

    res.status(200).json({ received: true });
  }
}

export default CreditController;
