const fs = require('fs');

let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

// Replace the entryTriggerPrice logic
const oldEntryCalcs = `  // Entry calculations
  const entryTriggerPrice = setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow;
  const distPts = entryTriggerPrice ? Math.abs(currentPrice - entryTriggerPrice).toFixed(1) : '—';`;

const newEntryCalcs = `  // Entry calculations
  const signal = state?.signalDetails;
  const actualEntry = signal?.entry || (setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow);
  const actualSl = signal?.sl || setup?.sl;
  const actualTp = signal?.tp || setup?.tp;
  
  const distPts = actualEntry ? Math.abs(currentPrice - actualEntry).toFixed(1) : '—';`;

content = content.replace(oldEntryCalcs, newEntryCalcs);

// Update where it's used
content = content.replace(/entryTriggerPrice\?/g, 'actualEntry?');
content = content.replace(/entryTriggerPrice /g, 'actualEntry ');
content = content.replace(/setup\?\.sl\?/g, 'actualSl?');
content = content.replace(/setup\?\.tp\?/g, 'actualTp?');

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
