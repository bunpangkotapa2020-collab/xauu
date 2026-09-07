import fs from 'fs';

async function checkSymbolSpec() {
  try {
    const stateStr = fs.readFileSync('state.json', 'utf-8');
    const state = JSON.parse(stateStr);
    const account = state.account;
    
    if (!account.metaApiToken || !account.metaApiAccountId || !account.metaApiUrl) {
      console.error("Missing MetaApi credentials in state.json");
      return;
    }

    const token = account.metaApiToken;
    const accountId = account.metaApiAccountId;
    const baseUrl = account.metaApiUrl;
    const symbol = 'XAUUSDc';

    console.log(`Connecting to MetaApi for account ${accountId}...`);
    
    // 1. Fetch Specification
    const specUrl = `${baseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/specification`;
    const specRes = await fetch(specUrl, {
      headers: { 'auth-token': token }
    });
    
    if (!specRes.ok) {
      console.error(`Failed to fetch specification: ${specRes.status} ${specRes.statusText}`);
      console.error(await specRes.text());
    } else {
      const spec = await specRes.json();
      console.log('\n--- 1. ACTUAL BROKER SYMBOL SPECIFICATION ---');
      console.log(`Symbol: ${symbol}`);
      console.log(`Digits: ${spec.digits}`);
      console.log(`Point Size: ${spec.pointSize ?? spec.point ?? spec.tickSize}`); // usually tickSize or similar, let's dump full spec fields we care about
      console.log(`Trade Mode: ${spec.tradeMode}`);
      console.log(`Min Stop Distance (StopsLevel): ${spec.stopsLevel}`);
      console.log(`Min Volume: ${spec.minVolume}`);
      console.log(`Max Volume: ${spec.maxVolume}`);
      console.log(`Volume Step: ${spec.volumeStep}`);
      
      const pointSize = spec.pointSize || spec.point || (1 / Math.pow(10, spec.digits)) || 0.01;
      console.log(`\n=> Extracted Point Size: ${pointSize}`);
      
      // Calculate Conversions
      const userSL = 10;
      const userTP = 8;
      
      console.log('\n--- 2. DA RA POINT CONVERSION TEST ---');
      console.log(`User Settings: SL = ${userSL} Points, TP = ${userTP} Points`);
      console.log(`Conversion formula: Points * PointSize`);
      console.log(`Converted SL Price Distance: ${userSL} * ${pointSize} = ${userSL * pointSize}`);
      console.log(`Converted TP Price Distance: ${userTP} * ${pointSize} = ${userTP * pointSize}`);

      console.log('\n--- 3. ORDER SIMULATION (Entry = 2700.000) ---');
      const entry = 2700.000;
      const slDist = userSL * pointSize;
      const tpDist = userTP * pointSize;
      
      console.log(`\nBUY ORDER:`);
      console.log(`Entry: ${entry.toFixed(3)}`);
      console.log(`SL: ${(entry - slDist).toFixed(3)}`);
      console.log(`TP: ${(entry + tpDist).toFixed(3)}`);
      
      console.log(`\nSELL ORDER:`);
      console.log(`Entry: ${entry.toFixed(3)}`);
      console.log(`SL: ${(entry + slDist).toFixed(3)}`);
      console.log(`TP: ${(entry - tpDist).toFixed(3)}`);
    }

  } catch (err) {
    console.error(err);
  }
}

checkSymbolSpec();
