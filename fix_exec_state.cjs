const fs = require('fs');

let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const oldStages = `  // Stages
  const isTriggered = setup?.stage === 'TRIGGERED' || (setup?.executionState && setup?.executionState !== 'WAITING');
  const isExecutionBlocked = setup?.executionState && setup.executionState.includes('REJECTED');
  const isOrderSent = setup?.executionState === 'ORDER_SENT' || setup?.executionState === 'POSITION_OPENED';
  const isPositionOpened = setup?.executionState === 'POSITION_OPENED';

  // Entry calculations
  const signal = state?.signalDetails;
  const actualEntry = signal?.entry || (setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow);
  const actualSl = signal?.sl || setup?.sl;
  const actualTp = signal?.tp || setup?.tp;`;

const newStages = `  const signal = state?.signalDetails;
  
  // Stages
  const actualExecutionState = signal?.executionState || setup?.executionState;
  const isTriggered = setup?.stage === 'TRIGGERED' || (actualExecutionState && actualExecutionState !== 'WAITING');
  const isExecutionBlocked = actualExecutionState && actualExecutionState.includes('REJECTED');
  const isOrderSent = actualExecutionState === 'ORDER_SENT' || actualExecutionState === 'POSITION_OPENED';
  const isPositionOpened = actualExecutionState === 'POSITION_OPENED';

  // Entry calculations
  const actualEntry = signal?.entry || (setup?.direction === 'BUY' ? setup?.obHigh : setup?.obLow);
  const actualSl = signal?.sl || setup?.sl;
  const actualTp = signal?.tp || setup?.tp;`;

content = content.replace(oldStages, newStages);
content = content.replace(/setup\?\.executionState/g, 'actualExecutionState');

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
