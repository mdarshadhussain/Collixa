import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient('https://onjiimuhqjmzltvlellk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamlpbXVocWptemx0dmxlbGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNDk1OSwiZXhwIjoyMDkxNDgwOTU5fQ.vYfxdOhSfeuljXlfgv_KxDnDcxK9LIYK3SiN9LyYuqg');

async function main() {
  const conversationId = 91;
  
  // 1. Delete all messages first
  await supabaseAdmin.from('messages').delete().eq('conversation_id', conversationId);

  // 2. Delete all participants
  const { error: pErr } = await supabaseAdmin.from('conversation_participants').delete().eq('conversation_id', conversationId);
  console.log('Participants deletion error:', pErr);

  // 3. Delete the conversation record
  const { error: deleteError } = await supabaseAdmin.from('conversations').delete().eq('id', conversationId);
  console.log('Conversation deletion error:', deleteError);
}

main();
