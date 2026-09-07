const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const firstLine = code.split('\n')[0];
console.log("First line:", firstLine);

const newTop = `import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { BotState } from './src/types.js';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function updateEnvVariable`;

code = code.replace('function updateEnvVariimport { BotState } from \'./src/types.js\';', newTop);
fs.writeFileSync('server.ts', code);
