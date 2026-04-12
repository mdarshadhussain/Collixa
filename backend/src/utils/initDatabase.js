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

    // Check if collaboration_requests table exists
    const { data, error } = await supabaseAdmin
      .from('collaboration_requests')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('📝 Creating collaboration_requests table...');

      // Using raw SQL to create the table
      const { error: createError } = await supabaseAdmin.rpc('exec', {
        sql: `
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
        `
      });

      if (createError) {
        console.warn('⚠️  Could not create table via RPC. You may need to create it manually via Supabase dashboard.');
        console.log('📋 SQL to run manually:');
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
      } else {
        console.log('✅ Created collaboration_requests table');
      }
    } else if (!error) {
      console.log('✅ collaboration_requests table already exists');
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
