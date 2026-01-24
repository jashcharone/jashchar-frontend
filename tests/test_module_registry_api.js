/**
 * API TEST SCRIPT FOR MODULE REGISTRY
 * Tests API endpoints with authentication
 */

require('dotenv').config({ path: './jashchar-backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const https = require('https');

// Simple fetch implementation using Node.js built-in http
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const lib = isHttps ? https : http;
    
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = lib.request(reqOptions, (res) => {
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

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://bjuteyzpcpbittmdzveq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqdXRleXpwY3BiaXR0bWR6dmVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ2OTQ0MSwiZXhwIjoyMDgyMDQ1NDQxfQ._USh-OzXMXmO5fdicwIz4E8RNgURTJ38218PdeQql30'
);

const API_BASE = 'http://localhost:5000/api/module-registry';
let authToken = null;
let testResults = [];

function logResult(testName, passed, details = '') {
  testResults.push({ testName, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${testName}${details ? ' - ' + details : ''}`);
}

async function getMasterAdminToken() {
  console.log('🔐 Getting Master Admin authentication...\n');
  
  // Get a master admin user
  const { data: masterAdmin, error: maErr } = await supabase
    .from('master_admin_profiles')
    .select('id, email')
    .limit(1)
    .single();
  
  if (maErr || !masterAdmin) {
    console.log('⚠️ No master admin found in database');
    return null;
  }
  
  console.log(`📧 Master Admin: ${masterAdmin.email}`);
  
  // Generate a service role token for testing
  // We'll create a simple JWT for the master admin
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
  
  const token = jwt.sign(
    { 
      id: masterAdmin.id,
      email: masterAdmin.email,
      role: 'master_admin'
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return token;
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

async function runAPITests() {
  console.log('\n🔬 MODULE REGISTRY API TEST SUITE\n');
  console.log('=' .repeat(60) + '\n');
  
  // Get authentication token
  authToken = await getMasterAdminToken();
  
  if (!authToken) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('✅ Got auth token\n');
  console.log('=' .repeat(60) + '\n');
  
  // ===================== TEST 1: GET /stats =====================
  console.log('📊 TEST 1: GET /stats');
  try {
    const { status, data } = await apiCall('GET', '/stats');
    const statsData = data.data || data; // Handle wrapped response
    if (status === 200 && (statsData.total_modules !== undefined || data.success)) {
      logResult('GET /stats', true, `Total: ${statsData.total_modules}, Active Plans: ${statsData.active_plans}`);
    } else {
      logResult('GET /stats', false, `Status: ${status}, ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logResult('GET /stats', false, err.message);
  }

  // ===================== TEST 2: GET /categories =====================
  console.log('\n📁 TEST 2: GET /categories');
  try {
    const { status, data } = await apiCall('GET', '/categories');
    const catData = data.data || data;
    if (status === 200 && (Array.isArray(catData) || data.success)) {
      const cats = Array.isArray(catData) ? catData : [];
      logResult('GET /categories', true, `Categories endpoint working (Status 200)`);
    } else {
      logResult('GET /categories', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET /categories', false, err.message);
  }

  // ===================== TEST 3: GET / (Module Tree) =====================
  console.log('\n🌳 TEST 3: GET / (Module Tree)');
  try {
    const { status, data } = await apiCall('GET', '/');
    const treeData = data.data || data;
    if (status === 200) {
      const modules = Array.isArray(treeData) ? treeData : [];
      logResult('GET / (tree)', true, `Module tree endpoint working (Status 200)`);
    } else {
      logResult('GET / (tree)', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET / (tree)', false, err.message);
  }

  // ===================== TEST 4: GET /flat =====================
  console.log('\n📋 TEST 4: GET /flat');
  try {
    const { status, data } = await apiCall('GET', '/flat');
    if (status === 200) {
      logResult('GET /flat', true, 'Flat list endpoint working (Status 200)');
    } else {
      logResult('GET /flat', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET /flat', false, err.message);
  }

  // ===================== TEST 5: POST / (Create Module) =====================
  console.log('\n➕ TEST 5: POST / (Create Module)');
  const testSlug = `api_test_module_${Date.now()}`;
  try {
    const { status, data } = await apiCall('POST', '/', {
      slug: testSlug,
      name: 'API Test Module',
      description: 'Created via API test',
      icon: 'TestTube',
      category: 'core',
      is_active: true
    });
    const moduleData = data.data || data;
    if (status === 201 || data.success) {
      logResult('POST / (create)', true, `Created: ${testSlug}`);
    } else {
      logResult('POST / (create)', false, `Status: ${status}, ${data.error || data.message || 'Unknown error'}`);
    }
  } catch (err) {
    logResult('POST / (create)', false, err.message);
  }

  // ===================== TEST 6: GET /:slug =====================
  console.log('\n🔍 TEST 6: GET /:slug');
  try {
    const { status, data } = await apiCall('GET', `/${testSlug}`);
    if (status === 200) {
      logResult('GET /:slug', true, `Found module: ${testSlug}`);
    } else {
      logResult('GET /:slug', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET /:slug', false, err.message);
  }

  // ===================== TEST 7: PUT /:slug =====================
  console.log('\n✏️ TEST 7: PUT /:slug (Update)');
  try {
    const { status, data } = await apiCall('PUT', `/${testSlug}`, {
      name: 'API Test Module - Updated',
      description: 'Updated via API test'
    });
    if (status === 200) {
      logResult('PUT /:slug', true, `Updated: ${data.name || testSlug}`);
    } else {
      logResult('PUT /:slug', false, `Status: ${status}, ${data.error || data.message}`);
    }
  } catch (err) {
    logResult('PUT /:slug', false, err.message);
  }

  // ===================== TEST 8: GET /versions =====================
  console.log('\n📜 TEST 8: GET /versions');
  try {
    const { status, data } = await apiCall('GET', '/versions');
    if (status === 200) {
      const versions = Array.isArray(data) ? data : (data.versions || []);
      logResult('GET /versions', true, `${versions.length} version records`);
    } else {
      logResult('GET /versions', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET /versions', false, err.message);
  }

  // ===================== TEST 9: GET /audit-log =====================
  console.log('\n📝 TEST 9: GET /audit-log');
  try {
    const { status, data } = await apiCall('GET', '/audit-log');
    if (status === 200) {
      const logs = Array.isArray(data) ? data : (data.logs || []);
      logResult('GET /audit-log', true, `${logs.length} audit records`);
    } else {
      logResult('GET /audit-log', false, `Status: ${status}`);
    }
  } catch (err) {
    logResult('GET /audit-log', false, err.message);
  }

  // ===================== TEST 10: DELETE /:slug =====================
  console.log('\n🗑️ TEST 10: DELETE /:slug');
  try {
    const { status, data } = await apiCall('DELETE', `/${testSlug}?hard=true`);
    if (status === 200) {
      logResult('DELETE /:slug', true, 'Module deleted');
    } else {
      logResult('DELETE /:slug', false, `Status: ${status}, ${data.error || data.message}`);
    }
  } catch (err) {
    logResult('DELETE /:slug', false, err.message);
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
}

// Check if backend is running first
fetch('http://localhost:5000/api/health').then(res => {
  if (res.ok) {
    console.log('✅ Backend is running\n');
    runAPITests();
  } else {
    console.log('⚠️ Backend returned non-OK status. Trying tests anyway...');
    runAPITests();
  }
}).catch(err => {
  console.log('❌ Backend not running at localhost:5000');
  console.log('   Please start the backend with: cd jashchar-backend && npm start');
  process.exit(1);
});
