const net = require('net');

const client = new net.Socket();
client.setTimeout(1000);

client.connect(5000, '127.0.0.1', function() {
  console.log('Port 5000 is OPEN');
  client.destroy();
});

client.on('error', function(e) {
  console.log('Port 5000 is CLOSED or Error: ' + e.message);
  client.destroy();
});

client.on('timeout', function() {
  console.log('Port 5000 TIMEOUT');
  client.destroy();
});
