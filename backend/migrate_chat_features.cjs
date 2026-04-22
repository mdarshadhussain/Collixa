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
  console.log('Running Chat Features migration...');
  
  // Try to use exec_sql RPC if it exists
  const { error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      -- Add role to participants
      ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS role text DEFAULT 'MEMBER';
      
      -- Add type and metadata to messages
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;

      -- Update existing conversations to ensure owners are admins
      -- This is a bit complex to do in a single query without knowing the owner,
      -- but we can assume the first participant or the intent creator is admin.
      -- For now, we'll just ensure the columns exist.
    `
  });

  if (error) {
    console.error('Migration failed via RPC.', error.message);
    console.log('\n--- IMPORTANT: MANUAL ACTION REQUIRED ---');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log("");
    console.log("ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS role text DEFAULT 'MEMBER';");
    console.log("ALTER TABLE messages ADD COLUMN IF NOT EXISTS type text DEFAULT 'text';");
    console.log("ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT NULL;");
    console.log("\n------------------------------------------");
  } else {
    console.log('Chat Features migration successful!');
  }
}

migrate();
