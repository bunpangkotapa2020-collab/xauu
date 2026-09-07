const fs = require('fs');

async function getLogs() {
  try {
    const res = await fetch('http://localhost:3000/api/telemetry'); // let's try the other endpoint if it exists
    const text = await res.text();
    console.log(text.substring(0, 500));
  } catch(e) {
    console.error(e.message);
  }
}
getLogs();
