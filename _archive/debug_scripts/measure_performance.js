const http = require('http');

const measure = (url, name) => {
  const start = Date.now();
  http.get(url, (res) => {
    const end = Date.now();
    console.log(`${name} Status: ${res.statusCode}`);
    console.log(`${name} Response Time: ${end - start}ms`);
    res.resume();
  }).on('error', (e) => {
    console.error(`${name} Error: ${e.message}`);
  });
};

console.log("Testing Performance...");
measure('http://localhost:5000/', 'Backend (Root)');
measure('http://localhost:3000/', 'Frontend (Home)');
measure('http://localhost:3000/login', 'Frontend (Login)');
