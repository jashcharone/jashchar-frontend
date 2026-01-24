/**
 * MODULE REGISTRY TEST SCRIPT
 * Tests all module registry functionality
 */

require('dotenv').config({ path: './jashchar-backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bjuteyzpcpbittmdzveq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

let testModuleSlug = null;
const testResults = [];

function logResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ' - ' + details : ''}`);
}

async function runTests() {
  console.log('\n🔬 MODULE REGISTRY TEST SUITE\n');
  console.log('=' .repeat(60) + '\n');

  // ===================== TEST 1: List All Modules =====================
  console.log('📋 TEST 1: List All Modules');
  try {
    const { data: modules, error } = await supabase
      .from('module_registry')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    
    const parentModules = modules.filter(m => !m.parent_slug);
    const subModules = modules.filter(m => m.parent_slug);
    
    logResult('List All Modules', true, `Found ${modules.length} modules (${parentModules.length} parents, ${subModules.length} sub-modules)`);
  } catch (err) {
    logResult('List All Modules', false, err.message);
  }

  // ===================== TEST 2: Get Module Tree =====================
  console.log('\n📊 TEST 2: Build Module Tree');
  try {
    const { data: modules, error } = await supabase
      .from('module_registry')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    
    if (error) throw error;
    
    const parentModules = modules.filter(m => !m.parent_slug);
    const subModules = modules.filter(m => m.parent_slug);
    
    const tree = parentModules.map(parent => ({
      ...parent,
      submodules: subModules.filter(sub => sub.parent_slug === parent.slug)
    }));
    
    logResult('Build Module Tree', true, `Tree built with ${tree.length} parent modules`);
    
    // Print sample tree
    console.log('\n   Sample Tree Structure:');
    tree.slice(0, 3).forEach(m => {
      console.log(`   └─ ${m.name} (${m.slug}) [${m.category}]`);
      m.submodules?.slice(0, 2).forEach(s => {
        console.log(`      └─ ${s.name} (${s.slug})`);
      });
    });
  } catch (err) {
    logResult('Build Module Tree', false, err.message);
  }

  // ===================== TEST 3: Get Categories =====================
  console.log('\n📁 TEST 3: Get Categories');
  try {
    const { data: modules, error } = await supabase
      .from('module_registry')
      .select('category')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const categories = [...new Set(modules.map(m => m.category).filter(Boolean))];
    logResult('Get Categories', true, `Found ${categories.length} categories: ${categories.join(', ')}`);
  } catch (err) {
    logResult('Get Categories', false, err.message);
  }

  // ===================== TEST 4: Get Stats =====================
  console.log('\n📈 TEST 4: Get Statistics');
  try {
    const { data: allModules, error: allErr } = await supabase
      .from('module_registry')
      .select('is_active, parent_slug, is_premium');
    
    if (allErr) throw allErr;
    
    const stats = {
      total_modules: allModules.length,
      active_modules: allModules.filter(m => m.is_active).length,
      parent_modules: allModules.filter(m => !m.parent_slug).length,
      sub_modules: allModules.filter(m => m.parent_slug).length,
      premium_modules: allModules.filter(m => m.is_premium).length
    };
    
    logResult('Get Statistics', true, `Total: ${stats.total_modules}, Active: ${stats.active_modules}, Premium: ${stats.premium_modules}`);
  } catch (err) {
    logResult('Get Statistics', false, err.message);
  }

  // ===================== TEST 5: Create New Module =====================
  console.log('\n➕ TEST 5: Create New Module');
  testModuleSlug = `test_module_${Date.now()}`;
  try {
    const { data: newModule, error } = await supabase
      .from('module_registry')
      .insert({
        slug: testModuleSlug,
        name: 'Test Module',
        name_kannada: 'ಪರೀಕ್ಷಾ ಮಾಡ್ಯೂಲ್',
        description: 'This is a test module created by automated tests',
        icon: 'Box',
        category: 'core',
        is_active: true,
        is_premium: false,
        sort_order: 999,
        default_permissions: ['view', 'create', 'edit', 'delete'],
        default_plans: ['basic', 'standard', 'premium', 'enterprise']
      })
      .select()
      .single();
    
    if (error) throw error;
    logResult('Create New Module', true, `Created: ${newModule.slug}`);
  } catch (err) {
    logResult('Create New Module', false, err.message);
  }

  // ===================== TEST 6: Get Single Module =====================
  console.log('\n🔍 TEST 6: Get Single Module');
  try {
    const { data: module, error } = await supabase
      .from('module_registry')
      .select('*')
      .eq('slug', testModuleSlug)
      .single();
    
    if (error) throw error;
    logResult('Get Single Module', true, `Found: ${module.name} (${module.slug})`);
  } catch (err) {
    logResult('Get Single Module', false, err.message);
  }

  // ===================== TEST 7: Update Module =====================
  console.log('\n✏️ TEST 7: Update Module');
  try {
    const { data: updated, error } = await supabase
      .from('module_registry')
      .update({
        name: 'Test Module - Updated',
        description: 'Updated description',
        is_premium: true
      })
      .eq('slug', testModuleSlug)
      .select()
      .single();
    
    if (error) throw error;
    logResult('Update Module', true, `Updated to: ${updated.name}, Premium: ${updated.is_premium}`);
  } catch (err) {
    logResult('Update Module', false, err.message);
  }

  // ===================== TEST 8: Create Sub-Module =====================
  console.log('\n📦 TEST 8: Create Sub-Module');
  const subModuleSlug = `${testModuleSlug}.submodule`;
  try {
    const { data: subModule, error } = await supabase
      .from('module_registry')
      .insert({
        slug: subModuleSlug,
        name: 'Test Sub-Module',
        description: 'Sub-module of test module',
        icon: 'Settings',
        category: 'core',
        parent_slug: testModuleSlug,
        is_active: true,
        sort_order: 1,
        default_permissions: ['view', 'edit']
      })
      .select()
      .single();
    
    if (error) throw error;
    logResult('Create Sub-Module', true, `Created: ${subModule.slug} (parent: ${subModule.parent_slug})`);
  } catch (err) {
    logResult('Create Sub-Module', false, err.message);
  }

  // ===================== TEST 9: Get Module with Submodules =====================
  console.log('\n🌳 TEST 9: Get Module with Submodules');
  try {
    const { data: parent, error: pErr } = await supabase
      .from('module_registry')
      .select('*')
      .eq('slug', testModuleSlug)
      .single();
    
    const { data: children, error: cErr } = await supabase
      .from('module_registry')
      .select('*')
      .eq('parent_slug', testModuleSlug);
    
    if (pErr || cErr) throw pErr || cErr;
    
    const moduleWithSubs = { ...parent, submodules: children };
    logResult('Get Module with Submodules', true, `${parent.name} has ${children.length} sub-module(s)`);
  } catch (err) {
    logResult('Get Module with Submodules', false, err.message);
  }

  // ===================== TEST 10: Check Plan Modules Integration =====================
  console.log('\n🔗 TEST 10: Plan Modules Integration');
  try {
    const { data: plans, error: plansErr } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .limit(3);
    
    if (plansErr) throw plansErr;
    
    if (plans && plans.length > 0) {
      const { data: planModules, error: pmErr } = await supabase
        .from('plan_modules')
        .select('plan_id, module_key')
        .in('plan_id', plans.map(p => p.id))
        .limit(10);
      
      if (pmErr) throw pmErr;
      
      logResult('Plan Modules Integration', true, `Found ${plans.length} plans, ${planModules?.length || 0} plan_modules mappings`);
    } else {
      logResult('Plan Modules Integration', true, 'No subscription plans found (might be expected in dev)');
    }
  } catch (err) {
    logResult('Plan Modules Integration', false, err.message);
  }

  // ===================== TEST 11: Soft Delete Module =====================
  console.log('\n🗑️ TEST 11: Soft Delete Module');
  try {
    // First delete sub-module
    const { error: subErr } = await supabase
      .from('module_registry')
      .update({ is_active: false })
      .eq('slug', subModuleSlug);
    
    if (subErr) throw subErr;
    
    // Then delete parent
    const { data: deleted, error } = await supabase
      .from('module_registry')
      .update({ is_active: false })
      .eq('slug', testModuleSlug)
      .select()
      .single();
    
    if (error) throw error;
    logResult('Soft Delete Module', true, `Deactivated: ${deleted.slug}, is_active: ${deleted.is_active}`);
  } catch (err) {
    logResult('Soft Delete Module', false, err.message);
  }

  // ===================== TEST 12: Hard Delete (Cleanup) =====================
  console.log('\n🧹 TEST 12: Cleanup Test Data');
  try {
    // Delete sub-module
    await supabase.from('module_registry').delete().eq('slug', subModuleSlug);
    
    // Delete parent module
    const { error } = await supabase.from('module_registry').delete().eq('slug', testModuleSlug);
    
    if (error) throw error;
    logResult('Cleanup Test Data', true, 'Test modules deleted');
  } catch (err) {
    logResult('Cleanup Test Data', false, err.message);
  }

  // ===================== SUMMARY =====================
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  
  console.log(`   Total Tests: ${testResults.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n   Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`   - ${t.testName}: ${t.details}`);
    });
  }
  
  console.log('\n' + '=' .repeat(60) + '\n');
  
  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
