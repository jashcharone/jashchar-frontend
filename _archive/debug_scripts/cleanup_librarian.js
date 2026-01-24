const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

/*
  FINAL CLEANUP - Check librarian_library orphans in MASTER_ADMIN
  These are sub-modules for a parent (librarian_library) that doesn't exist.
  They duplicate library.* modules in facilities category.
*/

async function cleanupLibrarianOrphans() {
  console.log('='.repeat(80));
  console.log('🧹 CLEANUP LIBRARIAN_LIBRARY ORPHANS');
  console.log('='.repeat(80));
  
  // Get all modules
  const { data: modules, error } = await supabase
    .from('module_registry')
    .select('*');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  // Find librarian_library sub-modules
  const librarianModules = modules.filter(m => m.slug.startsWith('librarian_library.'));
  
  console.log('\n📋 LIBRARIAN_LIBRARY MODULES (' + librarianModules.length + '):');
  console.log('-'.repeat(60));
  
  librarianModules.forEach(m => {
    console.log('   ' + m.slug);
    console.log('      Name: ' + m.name);
    console.log('      Category: ' + m.category);
    console.log('      Parent: ' + m.parent_slug);
    
    // Check if there's a library.* equivalent
    const librarySlug = m.slug.replace('librarian_library.', 'library.');
    const libraryMod = modules.find(mod => mod.slug === librarySlug);
    
    if (libraryMod) {
      console.log('      ✅ HAS EQUIVALENT: ' + librarySlug + ' in ' + libraryMod.category);
    } else {
      console.log('      ⚠️ NO EQUIVALENT in library.*');
    }
    console.log('');
  });
  
  // Decision: Delete librarian_library.* modules as they duplicate library.* modules
  const slugsToDelete = librarianModules.map(m => m.slug);
  
  console.log('\n📋 WILL DELETE THESE DUPLICATES:');
  slugsToDelete.forEach((s, i) => console.log((i+1) + '. ' + s));
  
  if (slugsToDelete.length === 0) {
    console.log('✅ No librarian_library modules found!');
    return;
  }
  
  // Backup
  const fs = require('fs');
  const backupPath = './backups/librarian_modules_backup_' + Date.now() + '.json';
  fs.writeFileSync(backupPath, JSON.stringify(librarianModules, null, 2));
  console.log('\n💾 Backup saved to:', backupPath);
  
  // Delete
  console.log('\n🗑️ DELETING...');
  
  const idsToDelete = librarianModules.map(m => m.id);
  
  const { data: deleted, error: deleteError } = await supabase
    .from('module_registry')
    .delete()
    .in('id', idsToDelete)
    .select();
  
  if (deleteError) {
    console.log('❌ Delete error:', deleteError.message);
    return;
  }
  
  console.log('✅ Deleted ' + deleted.length + ' librarian_library modules');
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 LIBRARIAN CLEANUP COMPLETE');
  console.log('='.repeat(80));
}

cleanupLibrarianOrphans();
