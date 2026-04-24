const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials (Service Role Key required)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Running Skill Notices Schema Migration...');
  
  const sql = `
    -- Create skill_notices table
    CREATE TABLE IF NOT EXISTS skill_notices (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      skill_id BIGINT REFERENCES skills(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Add RLS policy for skill_notices
    ALTER TABLE skill_notices ENABLE ROW LEVEL SECURITY;

    -- Everyone can read notices
    CREATE POLICY "Public notices access" ON skill_notices
      FOR SELECT USING (true);

    -- Leaders can insert notices
    CREATE POLICY "Leaders can post notices" ON skill_notices
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM skills 
          WHERE id = skill_notices.skill_id 
          AND user_id = auth.uid()
        )
      );

    -- Ensure skills table has required columns (backup check)
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 5;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]';
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS meeting_link TEXT;
  `;

  // Try using 'exec' RPC if available
  const { error } = await supabase.rpc('exec', { sql });

  if (error) {
    console.error('❌ Migration via RPC failed:', error.message);
    console.log('\n📋 PLEASE RUN THE FOLLOWING SQL MANUALLY IN SUPABASE SQL EDITOR:');
    console.log('------------------------------------------------------------');
    console.log(sql);
    console.log('------------------------------------------------------------');
  } else {
    console.log('✅ Skill notices schema updated successfully!');
  }
}

migrate();
