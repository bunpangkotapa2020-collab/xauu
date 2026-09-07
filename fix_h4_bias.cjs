const fs = require('fs');
let content = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');

content = content.replace(
  /<Box\s*title="H4 \/ H4"\s*active=\{h4Confirmed\}\s*>[\s\S]*?<\/Box>/,
  `<Box 
            title="H4 / H4" 
            active={h4Confirmed} 
          >
            {h4Confirmed ? (
              <>
                <div className="font-bold text-emerald-400">
                  {h4?.bias === 'BEARISH' ? 'BEARISH / ចុះ' : h4?.bias === 'BULLISH' ? 'BULLISH / ឡើង' : 'CONFIRMED'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">បានបញ្ជាក់</div>
              </>
            ) : (
              <>
                <div>WAITING</div>
                <div className="text-[11px] text-slate-400">កំពុងរង់ចាំ</div>
              </>
            )}
          </Box>`
);

fs.writeFileSync('src/components/IctPipelineFlow.tsx', content);
