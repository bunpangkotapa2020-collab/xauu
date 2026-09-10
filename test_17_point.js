import fetch from 'node-fetch';

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
    console.log("Starting 17-point test...");
    try {
        const adminHeaders = { 'Content-Type': 'application/json', 'Authorization': 'admin123' }; // Try without auth or figure out auth if needed.
        
        let res = await fetch('http://localhost:3000/api/bot/state');
        let state = await res.json();
        
        console.log("Current state:", state.state.status);
    } catch (e) {
        console.error(e);
    }
}
run();
