const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repair() {
  console.log('🛠 Repairing Existing Tribes...');
  
  // 1. Get all skills that don't have a conversation_id
  const { data: skills, error } = await supabase
    .from('skills')
    .select('id, name, user_id')
    .is('conversation_id', null);

  if (error) {
    console.error('Error fetching skills:', error);
    return;
  }

  console.log(`Found ${skills.length} tribes needing repair.`);

  for (const skill of skills) {
    console.log(`Repairing "${skill.name}"...`);
    
    try {
      // Create a Group Chat
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert([{
          type: 'GROUP',
          title: `Tribe: ${skill.name}`,
          admin_id: skill.user_id,
          last_message: 'Tribe Group Created'
        }])
        .select()
        .single();

      if (convError) throw convError;

      // Add expert as ADMIN
      await supabase.from('conversation_participants').insert([
        { conversation_id: conversation.id, user_id: skill.user_id, role: 'ADMIN' }
      ]);

      // Link to skill
      await supabase
        .from('skills')
        .update({ conversation_id: conversation.id })
        .eq('id', skill.id);

      // Add existing accepted members to the chat
      const { data: members } = await supabase
        .from('skill_exchanges')
        .select('requester_id')
        .eq('skill_id', skill.id)
        .eq('status', 'ACCEPTED');

      if (members && members.length > 0) {
        const participants = members.map(m => ({
          conversation_id: conversation.id,
          user_id: m.requester_id,
          role: 'MEMBER'
        }));
        await supabase.from('conversation_participants').insert(participants);
      }

      console.log(`✅ Fixed: ${skill.name}`);
    } catch (err) {
      console.error(`❌ Failed to fix ${skill.name}:`, err.message);
    }
  }

  console.log('🏁 Repair complete!');
}

repair();
