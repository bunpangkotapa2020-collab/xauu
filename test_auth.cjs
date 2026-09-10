const crypto = require('crypto');
const SESSION_SECRET = 'xauusd_secure_owner_admin_session_key_2026';

function generateAuthToken(username, role) {
  const payload = {
    username,
    role,
    issuedAt: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

const t = generateAuthToken('admin', 'admin');
console.log(t);
