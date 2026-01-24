/**
 * SYNC MODULES TO PRODUCTION
 * Using PostgreSQL direct connection
 */

const { Client } = require('pg');

const DEV_URL = 'postgresql://postgres:Charry%4020202025@db.bjuteyzpcpbittmdzveq.supabase.co:5432/postgres';
const PROD_URL = 'postgresql://postgres:Abhi%4020202025@db.fexjccrkgaeafyimpobv.supabase.co:5432/postgres';

async function syncModules() {
  console.log('='.repeat(80));
  console.log('🔄 SYNC MODULES: DEVELOPMENT → PRODUCTION (PostgreSQL)');
  console.log('='.repeat(80));
  
  const devClient = new Client({ 
    connectionString: DEV_URL,
    ssl: { rejectUnauthorized: false }
  });
  const prodClient = new Client({ 
    connectionString: PROD_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await devClient.connect();
    console.log('✅ Connected to DEVELOPMENT');
    
    await prodClient.connect();
    console.log('✅ Connected to PRODUCTION');
    
    // Get modules from both DBs
    const devResult = await devClient.query('SELECT * FROM module_registry ORDER BY slug');
    const prodResult = await prodClient.query('SELECT * FROM module_registry ORDER BY slug');
    
    const devModules = devResult.rows;
    const prodModules = prodResult.rows;
    
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
      const idsToDelete = toDeleteFromProd.map(m => "'" + m.id + "'").join(',');
      
      await prodClient.query('DELETE FROM module_registry WHERE id IN (' + idsToDelete + ')');
      console.log('   ✅ Deleted', toDeleteFromProd.length, 'modules from production');
    }
    
    // UPDATE categories in production
    if (categoryUpdates.length > 0) {
      console.log('\n🔄 UPDATING CATEGORIES IN PRODUCTION...');
      for (const update of categoryUpdates) {
        await prodClient.query(
          'UPDATE module_registry SET category = $1 WHERE id = $2',
          [update.newCategory, update.id]
        );
        console.log('   ✅ Updated', update.slug);
      }
    }
    
    // Verify
    console.log('\n🔍 VERIFICATION:');
    
    const prodAfterResult = await prodClient.query('SELECT COUNT(*) as count FROM module_registry');
    console.log('   Production modules after sync:', prodAfterResult.rows[0].count);
    
    console.log('\n' + '='.repeat(80));
    console.log('🏁 SYNC COMPLETE');
    console.log('='.repeat(80));
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  } finally {
    await devClient.end();
    await prodClient.end();
  }
}

syncModules();
