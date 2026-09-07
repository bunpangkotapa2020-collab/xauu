const fs = require('fs');

const mapRaw = fs.readFileSync('dist/server.cjs.map', 'utf8');
const mapData = JSON.parse(mapRaw);

const index = mapData.sources.findIndex(s => s.endsWith('server.ts') || s === 'server.ts');
if (index > -1) {
    const originalCode = mapData.sourcesContent[index];
    fs.writeFileSync('server_original_from_map.ts', originalCode);
    console.log("Extracted to server_original_from_map.ts");
} else {
    console.log("Not found in sources:", mapData.sources);
}
