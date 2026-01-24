const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

/*
  CLEANUP REMAINING GENERAL CATEGORY ORPHANS
  
  These are sub-modules in GENERAL category whose parents exist in proper categories.
  We need to:
  1. Move them to the same category as their parent
  2. Or delete them if they're true duplicates
*/

async function cleanupOrphans() {
  console.log('='.repeat(80));
  console.log('🧹 CLEANUP ORPHAN SUB-MODULES IN GENERAL');
  console.log('='.repeat(80));
  
  // Get all modules
  const { data: modules, error } = await supabase
    .from('module_registry')
    .select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  // Get all GENERAL category modules
  const generalModules = modules.filter(m => m.category === 'general');
  
  console.log('\n📋 GENERAL CATEGORY ORPHANS (' + generalModules.length + '):');
  console.log('-'.repeat(60));
  
  const toUpdate = [];
  const toDelete = [];
  
  for (const gm of generalModules) {
    // Find parent module
    const parent = modules.find(m => m.slug === gm.parent_slug && m.category !== 'general');
    
    if (parent) {
      // Parent exists in proper category - MOVE this sub-module to parent's category
      console.log('   ✅ MOVE: ' + gm.slug);
      console.log('      Parent: ' + parent.slug + ' in ' + parent.category);
      console.log('      Action: Move to ' + parent.category);
      toUpdate.push({ id: gm.id, slug: gm.slug, newCategory: parent.category, parent: parent.slug });
    } else {
      // Parent doesn't exist - check if this is a standalone module
      console.log('   ⚠️ ORPHAN: ' + gm.slug);
      console.log('      Parent: ' + gm.parent_slug + ' NOT FOUND');
      
      // Check what category the parent should be in based on slug prefix
      const prefix = gm.parent_slug;
      const categoriesForPrefix = {
        'academics': 'academics',
        'student_information': 'core',
        'alumni': 'administration',
        'qr_code_attendance': 'academics',
        'front_cms': 'cms',
        'download_center': 'administration',
        'zoom_live_classes': 'academics',
      };
      
      const suggestedCategory = categoriesForPrefix[prefix] || 'general';
      console.log('      Suggested category: ' + suggestedCategory);
      
      // Decision: Move to suggested category
      toUpdate.push({ id: gm.id, slug: gm.slug, newCategory: suggestedCategory, parent: gm.parent_slug });
    }
    console.log('');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 ACTIONS TO TAKE:');
  console.log('='.repeat(80));
  
  console.log('\n📦 MODULES TO UPDATE CATEGORY (' + toUpdate.length + '):');
  toUpdate.forEach((item, i) => {
    console.log((i+1) + '. ' + item.slug + ' → category: ' + item.newCategory);
  });
  
  if (toUpdate.length === 0) {
    console.log('✅ No modules to update!');
    return;
  }
  
  // Backup
  const fs = require('fs');
  const backupPath = './backups/moved_modules_backup_' + Date.now() + '.json';
  const backup = generalModules;
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log('\n💾 Backup saved to:', backupPath);
  
  // Update categories
  console.log('\n🔄 UPDATING CATEGORIES...');
  
  for (const item of toUpdate) {
    const { data, error: updateError } = await supabase
      .from('module_registry')
      .update({ category: item.newCategory })
      .eq('id', item.id)
      .select();
    
    if (updateError) {
      console.log('   ❌ Failed to update ' + item.slug + ': ' + updateError.message);
    } else {
      console.log('   ✅ Updated ' + item.slug + ' to ' + item.newCategory);
    }
  }
  
  // Verify
  console.log('\n🔍 VERIFICATION:');
  
  const { data: remaining } = await supabase
    .from('module_registry')
    .select('*');
  
  const generalAfter = remaining.filter(m => m.category === 'general');
  console.log('   GENERAL category modules remaining:', generalAfter.length);
  
  if (generalAfter.length > 0) {
    generalAfter.forEach(m => console.log('      - ' + m.slug));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 ORPHAN CLEANUP COMPLETE');
  console.log('='.repeat(80));
}

cleanupOrphans();
