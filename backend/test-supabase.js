import { supabase, supabaseAdmin } from './src/config/database.js';

async function test() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  const { data: anonData, error: anonError } = await supabase.from('users').select('count').limit(1);
  if (anonError) console.error('Anon Client Error:', anonError.message);
  else console.log('Anon Client success!');

  if (supabaseAdmin) {
    const { data: adminData, error: adminError } = await supabaseAdmin.from('users').select('count', { count: 'exact' });
    if (adminError) console.error('Admin Client Error:', adminError.message);
    else console.log('Admin Client success! Count:', adminData);
  } else {
    console.log('Admin Client NOT configured.');
  }
}

test();
