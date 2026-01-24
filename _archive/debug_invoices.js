const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const supabase = require('./backend/src/config/supabase');

async function checkInvoices() {
    console.log('Checking subscription_invoices table...');
    const { data, error } = await supabase
        .from('subscription_invoices')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, cannot infer columns easily via select.');
        }
    }
}

checkInvoices();
