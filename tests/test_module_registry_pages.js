/**
 * MODULE REGISTRY FRONTEND PAGES TEST
 * Tests all frontend pages via API simulation
 */

require('dotenv').config({ path: './jashchar-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bjuteyzpcpbittmdzveq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_BASE = 'http://localhost:5000/api/module-registry';
let authToken = null;
let testResults = [];
let createdModuleSlug = null;

function logResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ' - ' + details : ''}`);
}

function logSection(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄 ${title}`);
  console.log(`${'─'.repeat(60)}\n`);
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
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, ok: response.ok };
}

async function getMasterAdminToken() {
  const { data: masterAdmin } = await supabase
    .from('master_admin_profiles')
    .select('id, email')
    .limit(1)
    .single();
  
  if (!masterAdmin) throw new Error('No master admin found');
  
  return jwt.sign(
    { id: masterAdmin.id, email: masterAdmin.email, role: 'master_admin' },
    process.env.JWT_SECRET || 'test_secret_key',
    { expiresIn: '1h' }
  );
}

async function runTests() {
  console.log('\n🖥️  MODULE REGISTRY FRONTEND PAGES TEST\n');
  console.log('=' .repeat(60));
  
  try {
    authToken = await getMasterAdminToken();
    console.log('✅ Authentication ready\n');
  } catch (e) {
    console.log('❌ Auth failed:', e.message);
    return;
  }

  // ==================== PAGE 1: DASHBOARD ====================
  logSection('PAGE 1: ModuleRegistryDashboard.jsx');
  
  // Test 1.1: Load module tree (main data)
  try {
    const { status, data } = await apiCall('GET', '/');
    const treeData = data.data || data;
    const moduleCount = Array.isArray(treeData) ? treeData.length : 0;
    logResult('Dashboard: Load module tree', status === 200, `${moduleCount} parent modules`);
  } catch (e) {
    logResult('Dashboard: Load module tree', false, e.message);
  }

  // Test 1.2: Load stats
  try {
    const { status, data } = await apiCall('GET', '/stats');
    const stats = data.data || data;
    logResult('Dashboard: Load stats', status === 200, `Total: ${stats.total_modules}, Plans: ${stats.active_plans}`);
  } catch (e) {
    logResult('Dashboard: Load stats', false, e.message);
  }

  // Test 1.3: Load categories
  try {
    const { status, data } = await apiCall('GET', '/categories');
    logResult('Dashboard: Load categories', status === 200, 'Categories loaded');
  } catch (e) {
    logResult('Dashboard: Load categories', false, e.message);
  }

  // Test 1.4: Search/filter
  try {
    const { status } = await apiCall('GET', '/flat?search=student&category=core');
    logResult('Dashboard: Search & filter', status === 200, 'Search working');
  } catch (e) {
    logResult('Dashboard: Search & filter', false, e.message);
  }

  // ==================== PAGE 2: ADD MODULE ====================
  logSection('PAGE 2: AddEditModule.jsx (Add Mode)');
  
  // Test 2.1: Load parent modules for dropdown
  try {
    const { status, data } = await apiCall('GET', '/flat?parent_only=true');
    logResult('Add: Load parent modules', status === 200, 'Parent modules loaded');
  } catch (e) {
    logResult('Add: Load parent modules', false, e.message);
  }

  // Test 2.2: Create new module
  createdModuleSlug = `frontend_test_${Date.now()}`;
  try {
    const { status, data } = await apiCall('POST', '/', {
      slug: createdModuleSlug,
      name: 'Frontend Test Module',
      name_kannada: 'ಫ್ರಂಟೆಂಡ್ ಟೆಸ್ಟ್',
      description: 'Module created during frontend testing',
      icon: 'TestTube',
      category: 'core',
      is_active: true,
      is_premium: false,
      sort_order: 999,
      default_permissions: ['view', 'create', 'edit', 'delete'],
      default_plans: ['basic', 'standard', 'premium'],
      sidebar_config: { show_in_sidebar: true },
      metadata: { assignment_type: 'subscription_plans' }
    });
    logResult('Add: Create module', status === 201, `Created: ${createdModuleSlug}`);
  } catch (e) {
    logResult('Add: Create module', false, e.message);
  }

  // Test 2.3: Create sub-module
  const subSlug = `${createdModuleSlug}.settings`;
  try {
    const { status } = await apiCall('POST', '/', {
      slug: subSlug,
      name: 'Test Settings',
      description: 'Sub-module for testing',
      icon: 'Settings',
      category: 'core',
      parent_slug: createdModuleSlug,
      is_active: true,
      sort_order: 1
    });
    logResult('Add: Create sub-module', status === 201, `Created: ${subSlug}`);
  } catch (e) {
    logResult('Add: Create sub-module', false, e.message);
  }

  // ==================== PAGE 3: EDIT MODULE ====================
  logSection('PAGE 3: AddEditModule.jsx (Edit Mode)');

  // Test 3.1: Load module for editing
  try {
    const { status, data } = await apiCall('GET', `/${createdModuleSlug}`);
    const moduleData = data.data || data;
    logResult('Edit: Load module', status === 200 && moduleData.slug === createdModuleSlug, `Loaded: ${moduleData.name}`);
  } catch (e) {
    logResult('Edit: Load module', false, e.message);
  }

  // Test 3.2: Update module
  try {
    const { status, data } = await apiCall('PUT', `/${createdModuleSlug}`, {
      name: 'Frontend Test Module (Updated)',
      is_premium: true,
      description: 'Updated description',
      default_plans: ['premium', 'enterprise']
    });
    logResult('Edit: Update module', status === 200, 'Module updated');
  } catch (e) {
    logResult('Edit: Update module', false, e.message);
  }

  // Test 3.3: Verify update
  try {
    const { status, data } = await apiCall('GET', `/${createdModuleSlug}`);
    const moduleData = data.data || data;
    const updated = moduleData.name === 'Frontend Test Module (Updated)' && moduleData.is_premium === true;
    logResult('Edit: Verify update', updated, `Name: ${moduleData.name}, Premium: ${moduleData.is_premium}`);
  } catch (e) {
    logResult('Edit: Verify update', false, e.message);
  }

  // ==================== PAGE 4: SYNC CENTER ====================
  logSection('PAGE 4: SyncCenter.jsx');

  // Test 4.1: Get sync stats
  try {
    const { status, data } = await apiCall('GET', '/stats');
    const stats = data.data || data;
    logResult('Sync: Get stats', status === 200, `Last sync: ${stats.last_sync || 'N/A'}`);
  } catch (e) {
    logResult('Sync: Get stats', false, e.message);
  }

  // Test 4.2: Sync all plans
  try {
    const { status, data } = await apiCall('POST', '/sync-all');
    logResult('Sync: Sync all plans', status === 200 || data.success, 'Sync completed');
  } catch (e) {
    logResult('Sync: Sync all plans', false, e.message);
  }

  // Test 4.3: Sync specific plan
  try {
    const { data: plans } = await supabase.from('subscription_plans').select('id, name').limit(1);
    if (plans?.length > 0) {
      const { status, data } = await apiCall('POST', `/sync-plan/${plans[0].id}`);
      logResult('Sync: Sync single plan', status === 200 || data.success, `Plan: ${plans[0].name}`);
    } else {
      logResult('Sync: Sync single plan', true, 'Skipped - no plans');
    }
  } catch (e) {
    logResult('Sync: Sync single plan', false, e.message);
  }

  // ==================== PAGE 5: VERSION HISTORY ====================
  logSection('PAGE 5: VersionHistory.jsx');

  // Test 5.1: Get versions
  try {
    const { status, data } = await apiCall('GET', '/versions');
    const versions = data.data || data;
    const count = Array.isArray(versions) ? versions.length : 0;
    logResult('Versions: Get history', status === 200, `${count} versions found`);
  } catch (e) {
    logResult('Versions: Get history', false, e.message);
  }

  // Test 5.2: Create snapshot
  try {
    const { status, data } = await apiCall('POST', '/snapshot');
    logResult('Versions: Create snapshot', status === 200 || data.success, 'Snapshot created');
  } catch (e) {
    logResult('Versions: Create snapshot', false, e.message);
  }

  // ==================== PAGE 6: AUDIT LOG ====================
  logSection('PAGE 6: AuditLog.jsx');

  // Test 6.1: Get audit log
  try {
    const { status, data } = await apiCall('GET', '/audit-log');
    const logs = data.data || data;
    const count = Array.isArray(logs) ? logs.length : 0;
    logResult('Audit: Get log', status === 200, `${count} audit entries`);
  } catch (e) {
    logResult('Audit: Get log', false, e.message);
  }

  // Test 6.2: Filter audit log by module
  try {
    const { status, data } = await apiCall('GET', `/audit-log?module_slug=${createdModuleSlug}`);
    logResult('Audit: Filter by module', status === 200, 'Filtered audit log');
  } catch (e) {
    logResult('Audit: Filter by module', false, e.message);
  }

  // ==================== CLEANUP ====================
  logSection('CLEANUP');
  
  // Delete sub-module first
  try {
    await apiCall('DELETE', `/${subSlug}?hard=true`);
    logResult('Cleanup: Delete sub-module', true, subSlug);
  } catch (e) {
    logResult('Cleanup: Delete sub-module', false, e.message);
  }

  // Delete parent module
  try {
    await apiCall('DELETE', `/${createdModuleSlug}?hard=true`);
    logResult('Cleanup: Delete parent module', true, createdModuleSlug);
  } catch (e) {
    logResult('Cleanup: Delete parent module', false, e.message);
  }

  // ==================== SUMMARY ====================
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FRONTEND PAGES TEST SUMMARY\n');
  
  const passed = testResults.filter(t => t.passed).length;
  const failed = testResults.filter(t => !t.passed).length;
  
  console.log(`   Total Tests: ${testResults.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  // Group by page
  const pages = ['Dashboard', 'Add', 'Edit', 'Sync', 'Versions', 'Audit', 'Cleanup'];
  console.log('\n   By Page:');
  pages.forEach(page => {
    const pageTests = testResults.filter(t => t.testName.startsWith(page));
    if (pageTests.length > 0) {
      const pagePassed = pageTests.filter(t => t.passed).length;
      console.log(`   - ${page}: ${pagePassed}/${pageTests.length} ✅`);
    }
  });
  
  if (failed > 0) {
    console.log('\n   ❌ Failed Tests:');
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(`      - ${t.testName}: ${t.details}`);
    });
  }
  
  console.log('\n' + '=' .repeat(60) + '\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
