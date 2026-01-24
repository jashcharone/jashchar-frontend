const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const supabase = require('./backend/src/config/supabase');

async function checkSchema() {
    console.log('Checking communication_settings table...');
    
    // Check if table exists and get a row
    const { data, error } = await supabase
        .from('communication_settings')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching table:', error);
    } else {
        console.log('Table access successful. Rows found:', data.length);
        if (data.length > 0) {
            console.log('Sample row keys:', Object.keys(data[0]));
        }
    }

    // Check for multiple rows
    const { count, error: countError } = await supabase
        .from('communication_settings')
        .select('*', { count: 'exact', head: true });
    
    if (countError) {
        console.error('Error counting rows:', countError);
    } else {
        console.log('Total rows in communication_settings:', count);
    }
}

checkSchema();
