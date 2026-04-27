import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient('https://onjiimuhqjmzltvlellk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uamlpbXVocWptemx0dmxlbGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkwNDk1OSwiZXhwIjoyMDkxNDgwOTU5fQ.vYfxdOhSfeuljXlfgv_KxDnDcxK9LIYK3SiN9LyYuqg');

async function main() {
  // Create a pending conversation to test
  const { data: conv, error: createError } = await supabaseAdmin.from('conversations').insert([{
    type: 'DIRECT',
    participant_1: '0ae2f2ff-ecad-45cb-a4a9-de0a43bca2b6',
    participant_2: 'a1d3d553-b81a-494b-b540-e29b5b49df07',
    status: 'PENDING'
  }]).select().single();
  
  if (createError) {
    console.error('Create error:', createError);
    return;
  }
  console.log('Created pending conversation:', conv.id);

  // Now attempt to accept it exactly as the backend does
  const conversationId = conv.id;
  const recipientId = 'a1d3d553-b81a-494b-b540-e29b5b49df07';
  
  const { data: conversation, error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single();

  console.log('Update result:', conversation, updateError);
}
main();
