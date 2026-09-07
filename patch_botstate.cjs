const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('marketSpeed?:')) {
    content = content.replace(
        'spreadPoints: number;',
        'spreadPoints: number;\n  marketSpeed?: \'NORMAL\' | \'FAST\' | \'EXTREME\';\n  volatilityValue?: number;'
    );
    fs.writeFileSync('src/types.ts', content);
    console.log('patched src/types.ts');
} else {
    console.log('already patched');
}
