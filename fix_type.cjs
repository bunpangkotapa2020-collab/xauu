const fs = require('fs');
let ea = fs.readFileSync('src/MASTER_ICT_EA.ts', 'utf8');

const eapositionOld = `export interface EAPosition {
    ticket: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    lot: number;
    openPrice: number;
    sl: number;
    tp: number;
    magic: number;
    setupId: string;
        stage: string;
        executionState?: string;
        obHigh: number;
        obLow: number;
}`;

const eapositionNew = `export interface EAPosition {
    ticket: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    lot: number;
    openPrice: number;
    sl: number;
    tp: number;
    magic: number;
    setupId: string;
}`;

ea = ea.replace(eapositionOld, eapositionNew);
fs.writeFileSync('src/MASTER_ICT_EA.ts', ea);

let pipeline = fs.readFileSync('src/components/IctPipelineFlow.tsx', 'utf8');
pipeline = pipeline.replace(`import { ICTTelemetry } from '../types';`, `import { ICTTelemetry } from '../MASTER_ICT_EA';`);
fs.writeFileSync('src/components/IctPipelineFlow.tsx', pipeline);
