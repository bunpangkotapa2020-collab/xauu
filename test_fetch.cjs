const http = require('http');

http.get('http://localhost:3000/api/bot/state', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const json = JSON.parse(data);
    console.log("Bid:", json.bidPrice, "Ask:", json.askPrice, "Spread:", json.spreadPoints, "Status:", json.marketDataStatus);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
