const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/batch-data',
  method: 'GET',
  headers: {
    'x-user-role': 'admin'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => console.error(e));
req.end();
