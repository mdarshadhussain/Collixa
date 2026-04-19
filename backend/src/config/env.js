import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // Email Configuration
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'gmail', // gmail, smtp, sendgrid
  EMAIL_USER: process.env.EMAIL_USER, // Gmail: your-email@gmail.com
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD, // Gmail: app-password (not regular password)
  EMAIL_FROM: process.env.EMAIL_FROM, // Custom from address
  
  // SMTP Configuration (if using custom SMTP)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',

  // SendGrid Configuration (if using SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Google Gemini AI
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

// Validate required env vars
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing environment variable: ${envVar}`);
  }
});

// Warn if email not configured
if (!process.env.EMAIL_USER && !process.env.SENDGRID_API_KEY) {
  console.warn(`⚠️  Email not configured. OTP emails will not be sent. Set EMAIL_USER or SENDGRID_API_KEY.`);
}

export default config;
