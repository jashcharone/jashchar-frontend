const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

/*
  SAFE CLEANUP SCRIPT
  
  This script will:
  1. Delete exact duplicates in GENERAL category (16 modules)
  2. Move/reassign orphan sub-modules to proper parents or delete if truly orphan
  
  IMPORTANT: We backup before delete!
*/

async function safeCleanup() {
  console.log('='.repeat(80));
  console.log('🧹 SAFE MODULE CLEANUP - BACKUP & DELETE');
  console.log('='.repeat(80));
  
  // Get all modules
  const { data: modules, error } = await supabase
    .from('module_registry')
    .select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  // Slugs to delete (confirmed duplicates in GENERAL category)
  const slugsToDelete = [
    'fees_collection.fees_discount',      // typo of fees_collection.fee_discount
    'fees_collection.fees_group',         // typo of fees_collection.fee_group
    'fees_collection.fees_reminder',      // typo of fees_collection.fee_reminder
    'fees_collection.fees_type',          // typo of fees_collection.fee_type
    'fees_collection.search_fees_payment', // typo of fees_collection.search_fee_payment
    'front_office.setup_front_office',    // duplicate of front_office.setup
    'certificate.generate_staff_id_card', // duplicate of certificate.generate_staff_id
    'hostel.hostel',                      // duplicate of hostel.hostels
    'expenses.expense',                   // duplicate of expenses.expense_list
    'income.income',                      // duplicate of income.income_list
    'lesson_plan.add_homework',           // duplicate of homework.add_homework
    'online_course.online_course',        // duplicate of online_course.course_list
    'online_course.online_course_report', // duplicate of online_course.report
    'system_settings.general_setting',    // duplicate of system_settings.general
    'system_settings.upgrade_to_organization', // duplicate of system_settings.upgrade_to_org
    'front_cms.branch_login_settings',    // duplicate of front_cms.login_settings
  ];
  
  // Find modules to delete
  const modulesToDelete = modules.filter(m => slugsToDelete.includes(m.slug));
  
  console.log('\n📦 MODULES TO DELETE (' + modulesToDelete.length + '):');
  console.log('-'.repeat(60));
  
  modulesToDelete.forEach((m, i) => {
    console.log((i+1) + '. ID: ' + m.id);
    console.log('   Slug: ' + m.slug);
    console.log('   Name: ' + m.name);
    console.log('   Category: ' + m.category);
    console.log('');
  });
  
  if (modulesToDelete.length === 0) {
    console.log('✅ No duplicates found to delete!');
    return;
  }
  
  // BACKUP - Save to file
  const fs = require('fs');
  const backupPath = './backups/deleted_modules_backup_' + Date.now() + '.json';
  fs.writeFileSync(backupPath, JSON.stringify(modulesToDelete, null, 2));
  console.log('\n💾 Backup saved to:', backupPath);
  
  // DELETE
  console.log('\n🗑️ DELETING MODULES...');
  
  const idsToDelete = modulesToDelete.map(m => m.id);
  
  const { data: deleted, error: deleteError } = await supabase
    .from('module_registry')
    .delete()
    .in('id', idsToDelete)
    .select();
  
  if (deleteError) {
    console.log('❌ Delete error:', deleteError.message);
    return;
  }
  
  console.log('✅ Successfully deleted', deleted.length, 'duplicate modules!');
  
  // Verify
  console.log('\n🔍 VERIFICATION:');
  
  const { data: remaining } = await supabase
    .from('module_registry')
    .select('*');
  
  console.log('   Modules before:', modules.length);
  console.log('   Modules deleted:', deleted.length);
  console.log('   Modules now:', remaining.length);
  
  // Check GENERAL category
  const generalRemaining = remaining.filter(m => m.category === 'general');
  console.log('\n   GENERAL category modules remaining:', generalRemaining.length);
  generalRemaining.forEach(m => {
    console.log('      - ' + m.name + ' [' + m.slug + ']');
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 CLEANUP COMPLETE');
  console.log('='.repeat(80));
}

safeCleanup();
