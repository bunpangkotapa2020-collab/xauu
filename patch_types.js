const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('trailingActivated?: boolean')) {
    content = content.replace(
        'openedAt: string;',
        'openedAt: string;\n  trailingActivated?: boolean;\n  highestPriceReached?: number;\n  lowestPriceReached?: number;\n  trailingSlValue?: number;'
    );
    fs.writeFileSync('src/types.ts', content);
    console.log('patched types.ts');
} else {
    console.log('already patched types.ts');
}
