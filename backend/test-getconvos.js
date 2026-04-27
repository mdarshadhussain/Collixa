import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://onjiimuhqjmzltvlellk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamlpbXVocWptemx0dmxlbGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNDk1OSwiZXhwIjoyMDkxNDgwOTU5fQ.vYfxdOhSfeuljXlfgv_KxDnDcxK9LIYK3SiN9LyYuqg');

async function main() {
  const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1(id, name, avatar_url),
        participant_2(id, name, avatar_url),
        conversation_participants!inner(user_id)
      `)
      .eq('conversation_participants.user_id', 'a1d3d553-b81a-494b-b540-e29b5b49df07')
      .eq('status', 'PENDING');
      
  console.log('Error:', error);
  console.log('Conversations count:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('First:', JSON.stringify(data[0], null, 2));
  }
}

main();
