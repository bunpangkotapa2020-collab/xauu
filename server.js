// Production entry point for Cloud Run and standalone environments
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const distServer = path.join(__dirname, 'dist', 'server.cjs');
if (fs.existsSync(distServer)) {
  require(distServer);
} else {
  console.error('[CRITICAL] dist/server.cjs not found. Please build the project with "npm run build" before running.');
  process.exit(1);
}
