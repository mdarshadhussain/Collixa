import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateConstraint() {
  console.log('Attempting to update credit_transactions_type_check constraint...');
  
  // Try running a raw SQL query if the exec_sql RPC exists (common pattern in many projects)
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
    console.warn('RPC exec_sql failed or not found. This is expected if the RPC was never created.');
    console.log('Falling back to a manual approach if possible...');
    
    // If the above fails, we might just have to use 'SPEND' in the code.
    // However, sometimes projects use a generic 'query' RPC.
  } else {
    console.log('Constraint updated successfully via RPC!');
    process.exit(0);
  }

  // If we reach here, we'll suggest using SPEND type as a fallback in the service
  console.log('Action: Use "SPEND" type as a fallback in CreditService if REDEMPTION fails.');
  process.exit(1);
}

updateConstraint();
