/**
 * COMPLETE MODULE REGISTRY TEST SUITE
 * Tests all functionality including sync operations
 */

require('dotenv').config({ path: './jashchar-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bjuteyzpcpbittmdzveq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

const API_BASE = 'http://localhost:5000/api/module-registry';
let authToken = null;
let testResults = [];
let testModules = [];

function logResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ' - ' + details : ''}`);
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(data || '{}'))
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function apiCall(method, endpoint, body = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function getMasterAdminToken() {
  const { data: masterAdmin } = await supabase
    .from('master_admin_profiles')
    .select('id, email')
    .limit(1)
    .single();
  
  if (!masterAdmin) throw new Error('No master admin found');
  
  const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
  return jwt.sign(
    { id: masterAdmin.id, email: masterAdmin.email, role: 'master_admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function cleanupTestModules() {
  console.log('\n🧹 Cleaning up test modules...');
  for (const slug of testModules) {
    try {
      await supabase.from('module_registry').delete().eq('slug', slug);
    } catch (e) {}
  }
  console.log('   Cleanup complete\n');
}

async function runTests() {
  console.log('\n🔬 COMPLETE MODULE REGISTRY TEST SUITE\n');
  console.log('=' .repeat(70) + '\n');
  
  // Setup
  try {
    authToken = await getMasterAdminToken();
    console.log('✅ Authentication ready\n');
  } catch (e) {
    console.log('❌ Auth failed:', e.message);
    return;
  }

  // ==================== SECTION 1: CRUD TESTS ====================
  console.log('📦 SECTION 1: CRUD OPERATIONS\n');
  
  // Test 1.1: Create parent module
  const parentSlug = `test_parent_${Date.now()}`;
  testModules.push(parentSlug);
  try {
    const { status, data } = await apiCall('POST', '/', {
      slug: parentSlug,
      name: 'Test Parent Module',
      name_kannada: 'ಪರೀಕ್ಷಾ ಪ್ಯಾರೆಂಟ್',
      description: 'Parent module for testing',
      icon: 'Box',
      category: 'core',
      is_active: true,
      default_permissions: ['view', 'create', 'edit', 'delete'],
      default_plans: ['basic', 'standard', 'premium']
    });
    logResult('1.1 Create Parent Module', status === 201, `Slug: ${parentSlug}`);
  } catch (e) {
    logResult('1.1 Create Parent Module', false, e.message);
  }

  // Test 1.2: Create sub-module
  const subSlug = `${parentSlug}.submodule`;
  testModules.push(subSlug);
  try {
    const { status, data } = await apiCall('POST', '/', {
      slug: subSlug,
      name: 'Test Sub-Module',
      description: 'Sub-module under parent',
      icon: 'Settings',
      category: 'core',
      parent_slug: parentSlug,
      is_active: true,
      sort_order: 1
    });
    logResult('1.2 Create Sub-Module', status === 201, `Slug: ${subSlug}`);
  } catch (e) {
    logResult('1.2 Create Sub-Module', false, e.message);
  }

  // Test 1.3: Update parent module
  try {
    const { status, data } = await apiCall('PUT', `/${parentSlug}`, {
      name: 'Test Parent Module (Updated)',
      is_premium: true
    });
    logResult('1.3 Update Parent Module', status === 200, 'Name and premium flag updated');
  } catch (e) {
    logResult('1.3 Update Parent Module', false, e.message);
  }

  // Test 1.4: Get module with submodules
  try {
    const { status, data } = await apiCall('GET', `/${parentSlug}`);
    const moduleData = data.data || data;
    logResult('1.4 Get Module', status === 200, `Has submodules: ${moduleData.submodules?.length > 0}`);
  } catch (e) {
    logResult('1.4 Get Module', false, e.message);
  }

  // Test 1.5: Verify tree includes new module
  try {
    const { status, data } = await apiCall('GET', '/');
    const treeData = data.data || data;
    const found = Array.isArray(treeData) && treeData.some(m => m.slug === parentSlug);
    logResult('1.5 Module in Tree', found, `Found in tree: ${found}`);
  } catch (e) {
    logResult('1.5 Module in Tree', false, e.message);
  }

  // ==================== SECTION 2: SEARCH & FILTER TESTS ====================
  console.log('\n📋 SECTION 2: SEARCH & FILTER\n');

  // Test 2.1: Get by category
  try {
    const { status, data } = await apiCall('GET', '/flat?category=core');
    logResult('2.1 Filter by Category', status === 200, 'Filtered by core category');
  } catch (e) {
    logResult('2.1 Filter by Category', false, e.message);
  }

  // Test 2.2: Get only parent modules
  try {
    const { status, data } = await apiCall('GET', '/flat?parents_only=true');
    logResult('2.2 Parents Only', status === 200, 'Filtered to parents only');
  } catch (e) {
    logResult('2.2 Parents Only', false, e.message);
  }

  // Test 2.3: Search modules
  try {
    const { status, data } = await apiCall('GET', '/flat?search=dashboard');
    logResult('2.3 Search Modules', status === 200, 'Search for "dashboard"');
  } catch (e) {
    logResult('2.3 Search Modules', false, e.message);
  }

  // ==================== SECTION 3: SYNC TESTS ====================
  console.log('\n🔄 SECTION 3: SYNC OPERATIONS\n');

  // Test 3.1: Get sync stats
  try {
    const { status, data } = await apiCall('GET', '/stats');
    const statsData = data.data || data;
    logResult('3.1 Get Stats', status === 200 && statsData.total_modules, `Modules: ${statsData.total_modules}, Plans: ${statsData.active_plans}`);
  } catch (e) {
    logResult('3.1 Get Stats', false, e.message);
  }

  // Test 3.2: Sync all plans
  try {
    const { status, data } = await apiCall('POST', '/sync-all');
    logResult('3.2 Sync All Plans', status === 200 || data.success, 'Sync initiated');
  } catch (e) {
    logResult('3.2 Sync All Plans', false, e.message);
  }

  // Test 3.3: Sync specific plan (if plans exist)
  try {
    const { data: plans } = await supabase.from('subscription_plans').select('id').limit(1);
    if (plans?.length > 0) {
      const { status, data } = await apiCall('POST', `/sync-plan/${plans[0].id}`);
      logResult('3.3 Sync Single Plan', status === 200 || data.success, `Plan ID: ${plans[0].id}`);
    } else {
      logResult('3.3 Sync Single Plan', true, 'Skipped - no plans');
    }
  } catch (e) {
    logResult('3.3 Sync Single Plan', false, e.message);
  }

  // ==================== SECTION 4: BULK OPERATIONS ====================
  console.log('\n📦 SECTION 4: BULK OPERATIONS\n');

  // Test 4.1: Bulk upsert
  const bulkSlug1 = `test_bulk_1_${Date.now()}`;
  const bulkSlug2 = `test_bulk_2_${Date.now()}`;
  testModules.push(bulkSlug1, bulkSlug2);
  
  try {
    const { status, data } = await apiCall('POST', '/bulk', {
      modules: [
        { slug: bulkSlug1, name: 'Bulk Test 1', category: 'core', is_active: true },
        { slug: bulkSlug2, name: 'Bulk Test 2', category: 'core', is_active: true }
      ],
      auto_sync: false
    });
    logResult('4.1 Bulk Upsert', status === 200 || status === 201 || data.success, '2 modules created');
  } catch (e) {
    logResult('4.1 Bulk Upsert', false, e.message);
  }

  // ==================== SECTION 5: VERSION & AUDIT ====================
  console.log('\n📜 SECTION 5: VERSION & AUDIT\n');

  // Test 5.1: Get version history
  try {
    const { status, data } = await apiCall('GET', '/versions');
    logResult('5.1 Version History', status === 200, 'Version endpoint working');
  } catch (e) {
    logResult('5.1 Version History', false, e.message);
  }

  // Test 5.2: Get audit log
  try {
    const { status, data } = await apiCall('GET', '/audit-log');
    logResult('5.2 Audit Log', status === 200, 'Audit endpoint working');
  } catch (e) {
    logResult('5.2 Audit Log', false, e.message);
  }

  // Test 5.3: Create snapshot
  try {
    const { status, data } = await apiCall('POST', '/snapshot');
    logResult('5.3 Create Snapshot', status === 200 || status === 201 || data.success, 'Snapshot created');
  } catch (e) {
    logResult('5.3 Create Snapshot', false, e.message);
  }

  // ==================== SECTION 6: DELETE TESTS ====================
  console.log('\n🗑️ SECTION 6: DELETE OPERATIONS\n');

  // Test 6.1: Soft delete
  try {
    const { status, data } = await apiCall('DELETE', `/${bulkSlug1}`);
    logResult('6.1 Soft Delete', status === 200, `Soft deleted: ${bulkSlug1}`);
  } catch (e) {
    logResult('6.1 Soft Delete', false, e.message);
  }

  // Test 6.2: Hard delete
  try {
    const { status, data } = await apiCall('DELETE', `/${bulkSlug2}?hard=true`);
    logResult('6.2 Hard Delete', status === 200, `Hard deleted: ${bulkSlug2}`);
  } catch (e) {
    logResult('6.2 Hard Delete', false, e.message);
  }

  // ==================== SECTION 7: ERROR HANDLING ====================
  console.log('\n⚠️ SECTION 7: ERROR HANDLING\n');

  // Test 7.1: Get non-existent module
  try {
    const { status, data } = await apiCall('GET', '/non_existent_module_xyz');
    logResult('7.1 404 for Non-existent', status === 404, 'Returns 404');
  } catch (e) {
    logResult('7.1 404 for Non-existent', false, e.message);
  }

  // Test 7.2: Create duplicate slug (should fail)
  try {
    const { status, data } = await apiCall('POST', '/', {
      slug: 'dashboard', // Should already exist
      name: 'Duplicate Dashboard',
      category: 'core'
    });
    logResult('7.2 Reject Duplicate', status === 409 || status === 400 || data.error, 'Rejects duplicate slug');
  } catch (e) {
    logResult('7.2 Reject Duplicate', false, e.message);
  }

  // ==================== CLEANUP ====================
  await cleanupTestModules();

  // ==================== SUMMARY ====================
  console.log('=' .repeat(70));
  console.log('📊 FINAL TEST SUMMARY\n');
  
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  
  console.log(`   Total Tests: ${testResults.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n   ❌ Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`      - ${t.testName}: ${t.details}`);
    });
  }
  
  console.log('\n' + '=' .repeat(70) + '\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
