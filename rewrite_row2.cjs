const fs = require('fs');
let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

// Find everything between `{/* ROW 2: ENTRY */}` and `{/* ARROW DOWN */}` right before `{/* ROW 3: EXECUTION */}`
const startMarker = '{/* ROW 2: ENTRY */}';
const endMarker = '{/* ROW 3: EXECUTION */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers");
  process.exit(1);
}

// Keep the ARROW DOWN that comes before ROW 3 by capturing it
const beforeRow2 = content.substring(0, startIndex + startMarker.length);
// Find the exact location of the ARROW DOWN for row 3
const afterRow2Block = content.substring(endIndex);
// Need to find the ARROW DOWN just before ROW 3. 
// Actually, let's just replace the whole grid.

const row2Grid = `
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Box 
            title="ENTRY ZONE" 
            active={fullSetupConfirmed} 
          >
            <div className="text-[11px] text-slate-400 mb-1">តំបន់ចូល</div>
            {fullSetupConfirmed ? (
              <div className="font-black text-sm">[{setup?.obLow?.toFixed(3)} - {setup?.obHigh?.toFixed(3)}]</div>
            ) : (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            )}
          </Box>
          <Box 
            title="RETRACEMENT" 
            active={isTriggered || isRejectedBeforeTrigger} 
            error={isRejectedBeforeTrigger}
          >
            <div className="text-[11px] text-slate-400 mb-1">បកត្រឡប់</div>
            {isTriggered ? (
              <>
                <div className="text-emerald-400 font-bold">ENTERED ZONE</div>
                <div className="text-[11px] text-emerald-400/80">តម្លៃបានចូលតំបន់</div>
              </>
            ) : isRejectedBeforeTrigger ? (
              <>
                <div className="text-rose-400 font-bold">FAILED</div>
                <div className="text-[11px] text-rose-400/80">តម្លៃបានបំបែកតំបន់ OB</div>
              </>
            ) : fullSetupConfirmed ? (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            ) : (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            )}
          </Box>
          <Box 
            title="🎯 ACTUAL ENTRY" 
            active={isTriggered || fullSetupConfirmed} 
            highlight={fullSetupConfirmed && !isTriggered && !isRejectedBeforeTrigger}
            error={isExecutionBlocked && isTriggered}
          >
            <div className="text-[11px] text-slate-400 mb-1">ចំណុចចូលពិត</div>
            {isTriggered ? (
              <div className="space-y-0.5">
                <strong className="text-emerald-400 block text-xs">🟢 ENTRY TRIGGERED</strong>
                <span className="text-emerald-400/80 block text-[11px] mb-1">បានដល់ចំណុចចូល</span>
                
                <div className={\`font-bold \${setup?.direction === 'BUY' ? 'text-blue-400' : 'text-rose-400'}\`}>
                  {setup?.direction === 'BUY' ? 'BUY / ទិញ' : 'SELL / លក់'}
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">Entry:</span>
                  <strong className="text-white">{actualEntry?.toFixed(3)}</strong>
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">SL:</span>
                  <strong className="text-rose-400">{actualSl?.toFixed(3)}</strong>
                </div>
                <div className="flex justify-between gap-1 text-[11px] sm:text-xs">
                  <span className="text-slate-500">TP:</span>
                  <strong className="text-emerald-400">{actualTp?.toFixed(3)}</strong>
                </div>
              </div>
            ) : isRejectedBeforeTrigger ? (
              <>
                <div className="text-slate-500 font-bold">CANCELED</div>
                <div className="text-[11px] text-slate-500/80">បោះបង់</div>
              </>
            ) : fullSetupConfirmed ? (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            ) : (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            )}
          </Box>
        </div>
        
        {/* ARROW DOWN */}
        <div className="flex justify-center my-3 opacity-30">
          <ArrowDown size={16} className="text-slate-400" />
        </div>
        
`;

const endOfRow2 = content.lastIndexOf('{/* ARROW DOWN */}', endIndex);

content = content.substring(0, content.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-3">', startIndex)) 
          + row2Grid 
          + afterRow2Block;

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
