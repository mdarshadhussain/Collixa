const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log('Starting session migration...');
    
    const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
            id,
            request_id,
            skill_exchanges (
                skill_id,
                skills (
                    meeting_link
                )
            )
        `)
        .is('meeting_link', null);

    if (error) {
        console.error('Migration error:', error);
        return;
    }

    console.log(`Found ${sessions.length} sessions to update.`);

    for (const session of sessions) {
        const link = session.skill_exchanges?.skills?.meeting_link;
        if (link) {
            console.log(`Updating session ${session.id} with link: ${link}`);
            await supabase
                .from('sessions')
                .update({ meeting_link: link })
                .eq('id', session.id);
        }
    }

    console.log('Migration complete.');
}

migrate();
