const { createClient } = require('@supabase/supabase-js');

// Development DB (source - already cleaned)
const devSupabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

// Production DB (target) - NEW KEY
const prodSupabase = createClient(
  'https://fexjccrkgaeafyimpobv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleGpjY3JrZ2FlYWZ5aW1wb2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE4MDA4MCwiZXhwIjoyMDc3NzU2MDgwfQ.4WB2GEaSYsfM8lMccmk54EcnrerUGzmVUHMPVZ-ALoI'
);

async function syncModulesToProduction() {
  console.log('='.repeat(80));
  console.log('🔄 SYNC MODULES: DEVELOPMENT → PRODUCTION');
  console.log('='.repeat(80));
  
  // Get modules from both DBs
  const { data: devModules, error: devError } = await devSupabase
    .from('module_registry')
    .select('*');
  
  const { data: prodModules, error: prodError } = await prodSupabase
    .from('module_registry')
    .select('*');
  
  if (devError || prodError) {
    console.log('❌ Error fetching modules:', devError?.message || prodError?.message);
    return;
  }
  
  console.log('\n📊 COMPARISON:');
  console.log('   Development modules:', devModules.length);
  console.log('   Production modules:', prodModules.length);
  
  // Find slugs that need to be deleted from production
  const devSlugs = new Set(devModules.map(m => m.slug));
  const prodSlugs = new Set(prodModules.map(m => m.slug));
  
  const toDeleteFromProd = prodModules.filter(m => !devSlugs.has(m.slug));
  const toAddToProd = devModules.filter(m => !prodSlugs.has(m.slug));
  
  console.log('\n📋 TO DELETE FROM PRODUCTION (' + toDeleteFromProd.length + '):');
  toDeleteFromProd.forEach(m => console.log('   - ' + m.slug + ' (' + m.name + ')'));
  
  console.log('\n📋 TO ADD TO PRODUCTION (' + toAddToProd.length + '):');
  toAddToProd.forEach(m => console.log('   + ' + m.slug + ' (' + m.name + ')'));
  
  // Check for category updates needed
  const categoryUpdates = [];
  for (const devMod of devModules) {
    const prodMod = prodModules.find(m => m.slug === devMod.slug);
    if (prodMod && prodMod.category !== devMod.category) {
      categoryUpdates.push({
        slug: devMod.slug,
        oldCategory: prodMod.category,
        newCategory: devMod.category,
        id: prodMod.id
      });
    }
  }
  
  console.log('\n📋 CATEGORY UPDATES NEEDED (' + categoryUpdates.length + '):');
  categoryUpdates.forEach(u => console.log('   ~ ' + u.slug + ': ' + u.oldCategory + ' → ' + u.newCategory));
  
  if (toDeleteFromProd.length === 0 && toAddToProd.length === 0 && categoryUpdates.length === 0) {
    console.log('\n✅ Production is already in sync!');
    return;
  }
  
  // Backup production before changes
  const fs = require('fs');
  const backupPath = './backups/prod_modules_backup_' + Date.now() + '.json';
  fs.writeFileSync(backupPath, JSON.stringify(prodModules, null, 2));
  console.log('\n💾 Production backup saved to:', backupPath);
  
  // DELETE from production
  if (toDeleteFromProd.length > 0) {
    console.log('\n🗑️ DELETING FROM PRODUCTION...');
    const idsToDelete = toDeleteFromProd.map(m => m.id);
    
    const { data: deleted, error: deleteError } = await prodSupabase
      .from('module_registry')
      .delete()
      .in('id', idsToDelete)
      .select();
    
    if (deleteError) {
      console.log('   ❌ Delete error:', deleteError.message);
    } else {
      console.log('   ✅ Deleted', deleted.length, 'modules from production');
    }
  }
  
  // UPDATE categories in production
  if (categoryUpdates.length > 0) {
    console.log('\n🔄 UPDATING CATEGORIES IN PRODUCTION...');
    for (const update of categoryUpdates) {
      const { error: updateError } = await prodSupabase
        .from('module_registry')
        .update({ category: update.newCategory })
        .eq('id', update.id);
      
      if (updateError) {
        console.log('   ❌ Failed to update', update.slug, ':', updateError.message);
      } else {
        console.log('   ✅ Updated', update.slug);
      }
    }
  }
  
  // ADD missing modules to production
  if (toAddToProd.length > 0) {
    console.log('\n➕ ADDING MODULES TO PRODUCTION...');
    
    // Prepare modules for insert (remove id to let DB generate new ones)
    const modulesToInsert = toAddToProd.map(m => {
      const { id, ...rest } = m;
      return rest;
    });
    
    // Insert in batches of 50
    const batchSize = 50;
    let addedCount = 0;
    
    for (let i = 0; i < modulesToInsert.length; i += batchSize) {
      const batch = modulesToInsert.slice(i, i + batchSize);
      
      const { data: inserted, error: insertError } = await prodSupabase
        .from('module_registry')
        .insert(batch)
        .select();
      
      if (insertError) {
        console.log('   ❌ Insert error:', insertError.message);
      } else {
        addedCount += inserted.length;
        console.log('   ✅ Added batch', Math.floor(i/batchSize) + 1, ':', inserted.length, 'modules');
      }
    }
    
    console.log('   📦 Total added:', addedCount, 'modules');
  }
  
  // Verify
  console.log('\n🔍 VERIFICATION:');
  
  const { data: prodAfter } = await prodSupabase
    .from('module_registry')
    .select('*');
  
  console.log('   Production modules after sync:', prodAfter.length);
  
  // Check for remaining differences
  const prodSlugsAfter = new Set(prodAfter.map(m => m.slug));
  const stillDifferent = devModules.filter(m => !prodSlugsAfter.has(m.slug));
  
  if (stillDifferent.length === 0) {
    console.log('   ✅ Module count matches!');
  } else {
    console.log('   ⚠️', stillDifferent.length, 'modules still missing in production');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 SYNC COMPLETE');
  console.log('='.repeat(80));
}

syncModulesToProduction();
