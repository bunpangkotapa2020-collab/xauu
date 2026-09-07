async function run() {
    const res = await fetch('https://mt-client-api-v1.backup-new-york.agiliumtrade.ai/users/current/accounts/123/symbols/XAUUSDc/current-price');
    // Just looking to see if we can get a response format or if it fails without auth.
    console.log(res.status);
}
run();
