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
    .eq('type', 'ADMIN_ADD');
  
  if (data) {
    console.log('ADMIN_ADD transactions:', data);
  } else {
    console.log('Failed to fetch ADMIN_ADD:', error);
  }
}

probe();
