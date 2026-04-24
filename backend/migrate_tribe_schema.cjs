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
  console.log('🚀 Running Tribe Schema Migration...');
  
  const sql = `
    -- Ensure skills table has group columns
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 5;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]';
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS meeting_link TEXT;
  `;

  // We try using 'exec' which is the RPC name used in initDatabase.js
  const { error } = await supabase.rpc('exec', { sql });

  if (error) {
    console.error('❌ Migration via RPC failed:', error.message);
    console.log('\n📋 PLEASE RUN THE FOLLOWING SQL MANUALLY IN SUPABASE SQL EDITOR:');
    console.log('------------------------------------------------------------');
    console.log(sql);
    console.log('------------------------------------------------------------');
  } else {
    console.log('✅ Tribe schema updated successfully!');
  }
}

migrate();
