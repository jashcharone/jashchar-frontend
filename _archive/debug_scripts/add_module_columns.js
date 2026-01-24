/**
 * Add missing columns to module_registry table
 * Run this script to add columns needed by the Module Registry Edit page
 */
const { createClient } = require('@supabase/supabase-js');

// Development DB
const DEV_URL = 'https://bjuteyzpcpbittmdzveq.supabase.co';
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30';

// Production DB
const PROD_URL = 'https://fexjccrkgaeafyimpobv.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGpjY3JrZ2FlYWZ5aW1wb2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI0Nzg1MiwiZXhwIjoyMDQ5ODIzODUyfQ.X_Z0TATjbbRGK1U1MFWFP4sMmJmWWvEtcfMSa_-5FWc';

async function addMissingColumns(dbName, url, key) {
  console.log(`\n🔧 Adding columns to ${dbName} DB...`);
  
  const supabase = createClient(url, key);
  
  // Use RPC to run raw SQL (if function exists) or use direct table operations
  // Since we can't run ALTER TABLE directly, let's use a workaround:
  // We'll try to update each module with default values for new columns
  
  try {
    // First, let's check current columns
    const { data: sample } = await supabase.from('module_registry').select('*').limit(1);
    const existingColumns = sample ? Object.keys(sample[0]) : [];
    console.log('📋 Existing columns:', existingColumns.join(', '));
    
    const neededColumns = ['metadata', 'sidebar_config', 'is_premium', 'name_kannada'];
    const missingColumns = neededColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist!');
      return true;
    }
    
    console.log('❌ Missing columns:', missingColumns.join(', '));
    console.log('\n📝 Please run this SQL in Supabase Dashboard SQL Editor:');
    console.log('='.repeat(60));
    console.log(`
-- ADD MISSING COLUMNS TO MODULE_REGISTRY TABLE
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE module_registry ADD COLUMN IF NOT EXISTS name_kannada VARCHAR(255);
ALTER TABLE module_registry ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE module_registry ADD COLUMN IF NOT EXISTS sidebar_config JSONB DEFAULT '{"show_in_sidebar": true}';
ALTER TABLE module_registry ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'module_registry' 
AND column_name IN ('name_kannada', 'metadata', 'sidebar_config', 'is_premium');
    `);
    console.log('='.repeat(60));
    
    return false;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Module Registry Column Migration Script');
  console.log('=========================================\n');
  
  await addMissingColumns('Development', DEV_URL, DEV_KEY);
  await addMissingColumns('Production', PROD_URL, PROD_KEY);
  
  console.log('\n📌 After running the SQL, restart the backend server and try again.');
}

main();
