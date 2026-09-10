const http = require('http');
http.get('http://localhost:3000/api/bot/state', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const json = JSON.parse(data);
    console.log("maxSpreadPoints:", json.riskConfig.maxSpreadPoints);
    console.log("spreadPoints:", json.spreadPoints);
  });
});
