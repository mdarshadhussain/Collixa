const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateConstraint() {
  console.log('Attempting to update credit_transactions_type_check constraint...');
  
  // We can't run ALTER TABLE directly via the client easily unless we use an edge function or a RPC
  // However, we can try to see if there's a way to run raw SQL if enabled
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE credit_transactions 
      DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
      
      ALTER TABLE credit_transactions 
      ADD CONSTRAINT credit_transactions_type_check 
      CHECK (type IN ('PURCHASE', 'TRANSFER', 'EARN', 'ACHIEVEMENT', 'SPEND', 'REDEMPTION', 'BONUS'));
    `
  });

  if (error) {
    console.error('Failed to update constraint via RPC:', error.message);
    console.log('Falling back to using SPEND type for redemptions in code.');
  } else {
    console.log('Constraint updated successfully!');
  }
}

updateConstraint();
