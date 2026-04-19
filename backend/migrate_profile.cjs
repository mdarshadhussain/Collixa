const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Running migration...');
  
  // Try to use exec_sql RPC if it exists (common for migrations)
  const { error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS target_goal text DEFAULT '';
    `
  });

  if (error) {
    console.error('Migration failed. This might be because the rpc "exec_sql" is not defined or insufficient permissions.', error.message);
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log("ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';");
    console.log("ALTER TABLE users ADD COLUMN IF NOT EXISTS target_goal text DEFAULT '';");
  } else {
    console.log('Migration successful!');
  }
}

migrate();
