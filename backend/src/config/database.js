import { createClient } from '@supabase/supabase-js';
import config from './env.js';

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials. Check .env file.');
}

// Create Supabase client with anon key (for client-side operations)
export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

// Create Supabase client with service role key (for admin operations)
export const supabaseAdmin = config.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default supabase;
