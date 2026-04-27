import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('Columns in credit_transactions:', Object.keys(data[0]));
  } else {
    console.log('No data in credit_transactions to probe columns.');
  }
}

probe();
