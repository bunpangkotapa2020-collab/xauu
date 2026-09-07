const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endOfBrokenImports = code.indexOf('dotenv.config();');
if (endOfBrokenImports > -1) {
    code = `import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { BotState } from './src/types.js';
type BotServerState = BotState;

` + code.substring(endOfBrokenImports);
    fs.writeFileSync('server.ts', code);
    console.log("Fixed!");
}
