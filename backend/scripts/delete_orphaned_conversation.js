import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Searching for orphaned conversation: "Tribe: AI focused Content Writing"...');
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('title', 'Tribe: AI focused Content Writing')
    .eq('type', 'GROUP');

  if (error) {
    console.error('Error finding conversations:', error);
    return;
  }

  if (!conversations || conversations.length === 0) {
    console.log('No conversations found with that exact title.');
    return;
  }

  console.log(`Found ${conversations.length} conversations. Deleting...`);

  for (const conv of conversations) {
    console.log(`Deleting conversation ID: ${conv.id} (${conv.title})...`);
    
    // Delete participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conv.id);
      
    if (partError) {
      console.error(`Error deleting participants for ${conv.id}:`, partError);
    }

    // Delete messages
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conv.id);

    if (msgError) {
      console.error(`Error deleting messages for ${conv.id}:`, msgError);
    }

    // Delete conversation
    const { error: convDeleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conv.id);

    if (convDeleteError) {
      console.error(`Error deleting conversation record ${conv.id}:`, convDeleteError);
    } else {
      console.log(`Successfully deleted conversation ${conv.id}.`);
    }
  }
}

run();
