const http = require('http');

const measure = (url, name) => {
  const start = Date.now();
  console.log(`Testing ${name}...`);
  http.get(url, (res) => {
    const end = Date.now();
    console.log(`✅ ${name} Status: ${res.statusCode}`);
    console.log(`⏱️ ${name} Response Time: ${end - start}ms`);
    res.resume();
  }).on('error', (e) => {
    console.error(`❌ ${name} Error: ${e.message}`);
  });
};

console.log("=== Jashchar ERP Performance Test ===");
// Backend is on 5000
measure('http://127.0.0.1:5000/', 'Backend Health');

// Frontend is on 3006
measure('http://127.0.0.1:3006/', 'Frontend Home');
measure('http://127.0.0.1:3006/login', 'Frontend Login');
