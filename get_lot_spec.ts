import fs from 'fs';

async function checkLotSpec() {
  try {
    const stateStr = fs.readFileSync('state.json', 'utf-8');
    const state = JSON.parse(stateStr);
    const account = state.account;
    
    if (!account.metaApiToken || !account.metaApiAccountId || !account.metaApiUrl) {
      console.error("Missing MetaApi credentials.");
      return;
    }

    const token = account.metaApiToken;
    const accountId = account.metaApiAccountId;
    const baseUrl = account.metaApiUrl;
    const symbol = 'XAUUSDc';
    
    const specUrl = `${baseUrl}/users/current/accounts/${accountId}/symbols/${symbol}/specification`;
    const specRes = await fetch(specUrl, { headers: { 'auth-token': token } });
    
    if (!specRes.ok) {
      console.error(`Failed to fetch specification: ${specRes.status}`);
      return;
    }
    
    const spec = await specRes.json();
    console.log('\n--- XAUUSDc LOT SPECIFICATION ---');
    console.log(`Contract Size: ${spec.contractSize}`);
    console.log(`Min Volume: ${spec.minVolume}`);
    console.log(`Max Volume: ${spec.maxVolume}`);
    console.log(`Volume Step: ${spec.volumeStep}`);
    console.log(`Currency: ${spec.currency}`);
    console.log(`Margin Currency: ${spec.marginCurrency}`);
    console.log(`Base Currency: ${spec.baseCurrency}`);
    console.log(`Digits: ${spec.digits}`);
    console.log(`Point Size: ${spec.pointSize ?? spec.point}`);

    // Provide a sample calculation based on the actual specs
    const pointSize = spec.pointSize || 0.001;
    const contractSize = spec.contractSize || 100;

    console.log(`\n--- VALUE CALCULATION EXAMPLES ---`);
    const lotsToTest = [0.10, 0.50, 1.00, 1.50, 2.00];
    
    for (const lot of lotsToTest) {
      const pointValueUSC = (lot * contractSize * pointSize).toFixed(5);
      const standardMoveUSC = (lot * contractSize * 1.00).toFixed(2); // $1 move in gold
      console.log(`Lot: ${lot} -> Point Value: ${pointValueUSC} USC | $1 Move Value: ${standardMoveUSC} USC`);
    }

  } catch (err) {
    console.error(err);
  }
}

checkLotSpec();
