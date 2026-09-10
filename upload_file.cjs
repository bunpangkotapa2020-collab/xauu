const fs = require('fs');
const http = require('https');
const path = require('path');

const filePath = path.join(process.cwd(), 'public', 'dara_m1_ea_v2.4_DEPLOY.tar.gz');
const fileStream = fs.createReadStream(filePath);

const options = {
  hostname: 'transfer.sh',
  port: 443,
  path: '/dara_m1_ea_v2.4_DEPLOY.tar.gz',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/gzip'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

fileStream.pipe(req);
