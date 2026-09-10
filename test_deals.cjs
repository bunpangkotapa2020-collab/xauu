const fetch = require('node-fetch');

async function test() {
    let res = await fetch('http://localhost:3000/api/bot/state');
    let data = await res.json();
    let state = data.state;
    
    console.log("Magic Number:", state.magicNumber);
    console.log("Account:", state.account.metaApiAccountId);
    
    if(!state.account.metaApiToken) return console.log("No token");
    
    const startTime = encodeURIComponent("2024-01-01T00:00:00.000Z");
    const endTime = encodeURIComponent(new Date().toISOString());
    const url = `${state.account.metaApiUrl}/users/current/accounts/${state.account.metaApiAccountId}/history-deals/time/${startTime}/${endTime}?offset=0&limit=10`;
    
    try {
        let dealsRes = await fetch(url, { headers: { 'auth-token': state.account.metaApiToken } });
        let dealsData = await dealsRes.json();
        console.log("Deals Data:", JSON.stringify(dealsData).substring(0, 500));
    } catch(e) {
        console.error(e);
    }
}
test();
