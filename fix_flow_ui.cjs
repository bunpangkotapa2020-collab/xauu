const fs = require('fs');
let code = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const target1 = `<Box title="ENTRY: LOCKED / WAITING" active={fullSetupReady}>`;
const rep1 = `<Box title="ENTRY ZONE" active={fullSetupReady}>`;
code = code.replace(target1, rep1);

const target2 = `<Box title="🎯 ENTRY — EXECUTE" active={isTriggered} highlight={isTriggered}>`;
const rep2 = `<Box title="🎯 ENTRY — ចូលផ្សារ" active={isTriggered} highlight={isTriggered}>`;
code = code.replace(target2, rep2);

const target3 = `WAITING FOR PRICE TO REACH ENTRY`;
const rep3 = `WAITING FOR PRICE TO REACH ENTRY ZONE`;
code = code.replace(target3, rep3);

fs.writeFileSync('src/components/IctPipelineFlow.tsx', code);
console.log("Updated IctPipelineFlow.tsx labels.");
