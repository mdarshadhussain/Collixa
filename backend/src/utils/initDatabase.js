/**
 * Database Initialization Script
 * This script sets up the necessary tables in Supabase
 * Run this once to initialize the database
 */

import { supabaseAdmin } from '../config/database.js';

/**
 * Create collaboration_requests table if it doesn't exist
 */
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');

    const bootstrapSQL = `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 100;

      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL REFERENCES skill_exchanges(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
        meeting_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_request_id ON sessions(request_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_sender_id ON sessions(sender_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_receiver_id ON sessions(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);

      CREATE TABLE IF NOT EXISTS credit_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('EARN', 'SPEND')),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_credit_transactions_session_id ON credit_transactions(session_id);

      CREATE TABLE IF NOT EXISTS session_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, reviewer_id)
      );

      CREATE INDEX IF NOT EXISTS idx_session_reviews_session_id ON session_reviews(session_id);
      CREATE INDEX IF NOT EXISTS idx_session_reviews_reviewee_id ON session_reviews(reviewee_id);
    `;

    const { error } = await supabaseAdmin.rpc('exec', { sql: bootstrapSQL });
    if (error) {
      console.warn('⚠️  Could not run bootstrap SQL via RPC. Apply manually in Supabase SQL editor.');
      console.log(bootstrapSQL);
    } else {
      console.log('✅ Session, credit, and review schema ensured');
    }

    console.log('✨ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('\n📋 Manual Setup Instructions:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Open your project SQL editor');
    console.log('3. Run the following SQL:');
    console.log(`
      CREATE TABLE IF NOT EXISTS collaboration_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intent_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(intent_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_collaboration_requests_intent_id ON collaboration_requests(intent_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_requests_user_id ON collaboration_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_collaboration_requests_status ON collaboration_requests(status);
    `);
  }
};

export default initializeDatabase;
