const http = require('http');
const { performance } = require('perf_hooks');

console.log("\n🔍 JASHCHAR ERP PERFORMANCE DIAGNOSTIC REPORT\n");
console.log("=" .repeat(60));

const tests = [];
let completedTests = 0;

function measure(url, name, expectedStatus = 200) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    const req = http.get(url, { timeout: 10000 }, (res) => {
      const end = performance.now();
      const duration = Math.round(end - start);
      
      let status = '✅ PASS';
      let issue = '';
      
      if (duration > 3000) {
        status = '🐌 SLOW';
        issue = 'Response time > 3 seconds';
      } else if (duration > 1000) {
        status = '⚠️ WARN';
        issue = 'Response time > 1 second';
      }
      
      if (res.statusCode !== expectedStatus && res.statusCode !== 404) {
        status = '❌ FAIL';
        issue = `Expected ${expectedStatus}, got ${res.statusCode}`;
      }
      
      tests.push({
        name,
        status,
        duration,
        httpStatus: res.statusCode,
        issue
      });
      
      res.resume();
      completedTests++;
      
      if (completedTests === 5) {
        printReport();
      }
      
      resolve();
    });
    
    req.on('timeout', () => {
      const end = performance.now();
      const duration = Math.round(end - start);
      
      tests.push({
        name,
        status: '❌ TIMEOUT',
        duration,
        httpStatus: 'N/A',
        issue: 'Request timed out after 10 seconds'
      });
      
      completedTests++;
      req.destroy();
      
      if (completedTests === 5) {
        printReport();
      }
      
      resolve();
    });
    
    req.on('error', (e) => {
      tests.push({
        name,
        status: '❌ ERROR',
        duration: 0,
        httpStatus: 'N/A',
        issue: e.message
      });
      
      completedTests++;
      
      if (completedTests === 5) {
        printReport();
      }
      
      resolve();
    });
  });
}

function printReport() {
  console.log("\n📊 TEST RESULTS:\n");
  console.log("-".repeat(60));
  
  tests.forEach(test => {
    console.log(`${test.status} ${test.name}`);
    console.log(`   Duration: ${test.duration}ms | HTTP Status: ${test.httpStatus}`);
    if (test.issue) {
      console.log(`   Issue: ${test.issue}`);
    }
    console.log();
  });
  
  console.log("-".repeat(60));
  
  // Analysis
  console.log("\n🔬 PERFORMANCE ANALYSIS:\n");
  
  const slowTests = tests.filter(t => t.duration > 1000);
  const errorTests = tests.filter(t => t.status.includes('ERROR') || t.status.includes('TIMEOUT'));
  const avgDuration = Math.round(tests.reduce((sum, t) => sum + t.duration, 0) / tests.length);
  
  if (errorTests.length > 0) {
    console.log("❌ CRITICAL: Server connection failures detected");
    console.log("   - Check if both servers are running");
    console.log("   - Backend should be on port 5000");
    console.log("   - Frontend should be on port 3005");
  }
  
  if (slowTests.length > 0) {
    console.log("🐌 PERFORMANCE ISSUES:");
    slowTests.forEach(t => {
      console.log(`   - ${t.name}: ${t.duration}ms`);
    });
    console.log("\n   Recommended Actions:");
    console.log("   1. Check Supabase connection (slow DB queries)");
    console.log("   2. Review PermissionContext loading");
    console.log("   3. Check React component re-renders");
    console.log("   4. Review large data fetches in Sidebar");
  } else if (avgDuration < 500) {
    console.log("✅ EXCELLENT: All endpoints responding quickly");
    console.log(`   Average response time: ${avgDuration}ms`);
  } else if (avgDuration < 1000) {
    console.log("✅ GOOD: Performance is acceptable");
    console.log(`   Average response time: ${avgDuration}ms`);
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("\n💡 TIP: If pages still feel slow:");
  console.log("   - Open Chrome DevTools > Performance tab");
  console.log("   - Record while navigating to slow page");
  console.log("   - Look for large JavaScript execution blocks");
  console.log("   - Check Network tab for repeated API calls");
  console.log("\n");
}

// Run all tests
Promise.all([
  measure('http://127.0.0.1:5000/', 'Backend API Health'),
  measure('http://127.0.0.1:5000/api', 'Backend API Routes'),
  measure('http://127.0.0.1:3005/', 'Frontend Root', 200),
  measure('http://127.0.0.1:3005/login', 'Frontend Login Page', 200),
  measure('http://127.0.0.1:3005/assets/index.js', 'Frontend Assets', 200)
]);
