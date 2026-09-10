const http = require('http');
http.get('http://localhost:3000/api/bot/state', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const json = JSON.parse(data);
    console.log("Status:", json.marketDataStatus);
  });
});
