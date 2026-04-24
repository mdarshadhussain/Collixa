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
  console.log('🚀 Running Duration Column Migration...');
  
  const sql = `
    -- Add duration column to skills table
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS duration TEXT;
    
    -- Also ensure status column exists while we are at it
    ALTER TABLE skills ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  `;

  // Try using 'exec' RPC
  const { error } = await supabase.rpc('exec', { sql });

  if (error) {
    console.error('❌ Migration via RPC failed:', error.message);
    console.log('\n📋 PLEASE RUN THE FOLLOWING SQL MANUALLY IN SUPABASE SQL EDITOR:');
    console.log('------------------------------------------------------------');
    console.log(sql);
    console.log('------------------------------------------------------------');
    
    // Attempt fallback if RPC fails - sometimes rpc('exec') isn't available
    console.log('\nTrying fallback... (direct table modification via RPC might not be allowed)');
  } else {
    console.log('✅ Duration column added successfully!');
  }
}

migrate();
