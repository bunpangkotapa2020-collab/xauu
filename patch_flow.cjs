const fs = require('fs');
let code = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

const m1State = `  const h4Confirmed = h4?.structure === 'CONFIRMED';
  const m15Confirmed = m15?.cisd === 'CONFIRMED' && m15?.liquiditySweep === 'FOUND';`;
const newM1State = `  const h4Confirmed = h4?.structure === 'CONFIRMED';
  const m15Confirmed = m15?.cisd === 'CONFIRMED' && m15?.liquiditySweep === 'FOUND';
  const m1Confirmed = telemetry.m1?.displacement === 'FOUND' || fullSetupReady; // Using displacement field as general confirmation`;
code = code.replace(m1State, newM1State);

const grid1 = `        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Box title="H4 BIAS" active={h4Confirmed}>
            {h4Confirmed ? (
              <span className="text-emerald-400 font-bold">{h4?.bias === 'BEARISH' ? 'BEARISH / ចុះ' : 'BULLISH / ឡើង'}</span>
            ) : 'WAITING'}
          </Box>
          <Box title="M15 CONFIRMATION" active={m15Confirmed}>
            {m15Confirmed ? <span className="text-emerald-400 font-bold">CONFIRMED</span> : 'WAITING'}
          </Box>
        </div>`;
const grid1New = `        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Box title="H4 BIAS" active={h4Confirmed}>
            {h4Confirmed ? (
              <span className="text-emerald-400 font-bold">{h4?.bias === 'BEARISH' ? 'BEARISH / ចុះ' : 'BULLISH / ឡើង'}</span>
            ) : 'WAITING'}
          </Box>
          <Box title="M15 CONFIRMATION" active={m15Confirmed}>
            {m15Confirmed ? <span className="text-emerald-400 font-bold">CONFIRMED</span> : 'WAITING'}
          </Box>
          <Box title="M1 CONFIRMATION" active={m1Confirmed}>
            {m1Confirmed ? <span className="text-emerald-400 font-bold">CONFIRMED</span> : 'WAITING'}
          </Box>
        </div>`;
code = code.replace(grid1, grid1New);

fs.writeFileSync('src/components/IctPipelineFlow.tsx', code);
console.log("Patched IctPipelineFlow");
