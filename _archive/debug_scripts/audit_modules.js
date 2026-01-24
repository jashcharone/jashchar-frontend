const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bjuteyzpcpbittmdzveq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

async function auditModules() {
  console.log('='.repeat(80));
  console.log('🔍 MODULE REGISTRY FULL AUDIT');
  console.log('='.repeat(80));
  
  // Get all modules
  const { data: modules, error } = await supabase
    .from('module_registry')
    .select('*')
    .order('category')
    .order('slug');
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log('\n📊 Total Modules:', modules.length);
  
  // ===== 1. CHECK DUPLICATE SLUGS =====
  console.log('\n' + '='.repeat(80));
  console.log('1️⃣ DUPLICATE SLUGS CHECK');
  console.log('='.repeat(80));
  
  const slugCounts = {};
  modules.forEach(m => {
    slugCounts[m.slug] = (slugCounts[m.slug] || 0) + 1;
  });
  
  const duplicateSlugs = Object.entries(slugCounts).filter(([k, v]) => v > 1);
  
  if (duplicateSlugs.length === 0) {
    console.log('✅ No duplicate slugs found');
  } else {
    console.log('❌ Found ' + duplicateSlugs.length + ' duplicate slugs:');
    duplicateSlugs.forEach(([slug, count]) => {
      console.log('   ' + slug + ' : ' + count + ' times');
      const dups = modules.filter(m => m.slug === slug);
      dups.forEach(d => console.log('      ID: ' + d.id + ' | Name: ' + d.name));
    });
  }
  
  // ===== 2. CHECK DUPLICATE NAMES =====
  console.log('\n' + '='.repeat(80));
  console.log('2️⃣ DUPLICATE NAMES CHECK');
  console.log('='.repeat(80));
  
  const nameCounts = {};
  modules.forEach(m => {
    const key = m.name + '|' + (m.category || 'none');
    nameCounts[key] = (nameCounts[key] || 0) + 1;
  });
  
  const duplicateNames = Object.entries(nameCounts).filter(([k, v]) => v > 1);
  
  if (duplicateNames.length === 0) {
    console.log('✅ No duplicate names in same category');
  } else {
    console.log('⚠️ Found ' + duplicateNames.length + ' duplicate name+category combinations:');
    duplicateNames.forEach(([key, count]) => {
      const [name, cat] = key.split('|');
      console.log('   "' + name + '" in category "' + cat + '" (' + count + ' times):');
      const dups = modules.filter(m => m.name === name && (m.category || 'none') === cat);
      dups.forEach(d => console.log('      ID: ' + d.id + ' | Slug: ' + d.slug + ' | Parent: ' + (d.parent_slug || 'NONE')));
    });
  }
  
  // ===== 3. CATEGORY BREAKDOWN =====
  console.log('\n' + '='.repeat(80));
  console.log('3️⃣ CATEGORY BREAKDOWN');
  console.log('='.repeat(80));
  
  const categories = {};
  modules.forEach(m => {
    categories[m.category || 'uncategorized'] = (categories[m.category || 'uncategorized'] || 0) + 1;
  });
  
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log('   ' + (cat || 'uncategorized').padEnd(25) + ' : ' + count + ' modules');
    });
  
  // ===== 4. HIERARCHY CHECK =====
  console.log('\n' + '='.repeat(80));
  console.log('4️⃣ HIERARCHY CHECK');
  console.log('='.repeat(80));
  
  const parents = modules.filter(m => !m.is_submodule);
  const subs = modules.filter(m => m.is_submodule);
  
  console.log('   Parent modules: ' + parents.length);
  console.log('   Sub-modules: ' + subs.length);
  
  // Check orphan sub-modules
  const parentSlugs = new Set(modules.map(m => m.slug));
  const orphans = subs.filter(m => m.parent_slug && !parentSlugs.has(m.parent_slug));
  
  console.log('\n   Orphan sub-modules (parent not found):');
  if (orphans.length === 0) {
    console.log('   ✅ No orphan sub-modules');
  } else {
    console.log('   ❌ Found ' + orphans.length + ' orphans:');
    orphans.forEach(m => console.log('      ' + m.slug + ' -> missing parent: ' + m.parent_slug));
  }
  
  // ===== 5. DETAILED MODULE LIST BY CATEGORY =====
  console.log('\n' + '='.repeat(80));
  console.log('5️⃣ DETAILED MODULE LIST BY CATEGORY');
  console.log('='.repeat(80));
  
  const byCategory = {};
  modules.forEach(m => {
    const cat = m.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(m);
  });
  
  Object.keys(byCategory).sort().forEach(cat => {
    console.log('\n📁 ' + cat.toUpperCase());
    console.log('-'.repeat(60));
    
    const catModules = byCategory[cat];
    const parentMods = catModules.filter(m => !m.is_submodule);
    
    parentMods.forEach(p => {
      console.log('   📦 ' + p.name + ' [' + p.slug + ']');
      const children = catModules.filter(m => m.parent_slug === p.slug);
      children.forEach(c => {
        console.log('      └─ ' + c.name + ' [' + c.slug + ']');
      });
    });
    
    // Sub-modules without parent in same category
    const orphanInCat = catModules.filter(m => m.is_submodule && !parentMods.find(p => p.slug === m.parent_slug));
    if (orphanInCat.length > 0) {
      console.log('   ⚠️ Sub-modules with external/missing parent:');
      orphanInCat.forEach(o => {
        console.log('      └─ ' + o.name + ' [' + o.slug + '] -> parent: ' + (o.parent_slug || 'NONE'));
      });
    }
  });
  
  // ===== 6. POTENTIAL DUPLICATES (Similar names) =====
  console.log('\n' + '='.repeat(80));
  console.log('6️⃣ POTENTIAL DUPLICATES (Similar Names)');
  console.log('='.repeat(80));
  
  const normalizeForCompare = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const normalizedNames = {};
  modules.forEach(m => {
    const norm = normalizeForCompare(m.name);
    if (!normalizedNames[norm]) normalizedNames[norm] = [];
    normalizedNames[norm].push(m);
  });
  
  const similarNames = Object.entries(normalizedNames).filter(([k, v]) => v.length > 1);
  
  if (similarNames.length === 0) {
    console.log('✅ No modules with similar names found');
  } else {
    console.log('⚠️ Found ' + similarNames.length + ' groups of similar module names:');
    similarNames.forEach(([norm, mods]) => {
      console.log('\n   Group (normalized: "' + norm + '"):');
      mods.forEach(m => {
        console.log('      ID: ' + m.id);
        console.log('         Name: "' + m.name + '"');
        console.log('         Slug: ' + m.slug);
        console.log('         Category: ' + m.category);
        console.log('         Is Sub: ' + m.is_submodule + ' | Parent: ' + (m.parent_slug || 'NONE'));
      });
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 AUDIT COMPLETE');
  console.log('='.repeat(80));
}

auditModules();
