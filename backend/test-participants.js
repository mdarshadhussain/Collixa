import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://onjiimuhqjmzltvlellk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamlpbXVocWptemx0dmxlbGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNDk1OSwiZXhwIjoyMDkxNDgwOTU5fQ.vYfxdOhSfeuljXlfgv_KxDnDcxK9LIYK3SiN9LyYuqg');

async function main() {
  const { data, error } = await supabase.from('conversation_participants').select('*').eq('conversation_id', 91);
  console.log('Error:', error);
  console.log('Participants:', JSON.stringify(data, null, 2));
}

main();
