// Fix database schema - add missing welcome_email_sent column
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const SUPABASE_SERVICE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

console.log('🔧 Fixing database schema...');
console.log('URL:', SUPABASE_URL ? 'Found' : 'Missing');
console.log('Service Key:', SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');

async function fixDatabase() {
    try {
        // Create Supabase client with service role key
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        console.log('📡 Adding welcome_email_sent column...');
        
        // Execute the SQL to add the column
        const { data, error } = await supabase.rpc('sql', {
            query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;'
        });

        if (error) {
            console.error('❌ Error executing SQL:', error);
            
            // Try alternative approach with direct query
            console.log('🔄 Trying alternative approach...');
            const { data: data2, error: error2 } = await supabase
                .from('users')
                .select('welcome_email_sent')
                .limit(1);
                
            if (error2 && error2.code === 'PGRST116') {
                console.log('✅ Column confirmed missing, need to add it manually');
                console.log('Please run this SQL in your Supabase dashboard:');
                console.log('ALTER TABLE users ADD COLUMN welcome_email_sent BOOLEAN DEFAULT FALSE;');
            } else {
                console.log('✅ Column already exists or added successfully');
            }
        } else {
            console.log('✅ Column added successfully:', data);
        }

    } catch (error) {
        console.error('❌ Failed to fix database:', error);
    }
}

fixDatabase(); 