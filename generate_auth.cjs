const crypto = require('crypto');
const fs = require('fs');

function hashPassword(password, salt = undefined) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, generatedSalt, 100000, 64, 'sha512');
  return {
    hash: derivedKey.toString('hex'),
    salt: generatedSalt,
  };
}

const user = 'admin';
const pass = 'admin12345';
const { hash, salt } = hashPassword(pass);

const currentAdminAuth = JSON.parse(fs.readFileSync('./data/admin_auth.json', 'utf-8'));
currentAdminAuth.username = user;
currentAdminAuth.passwordHash = hash;
currentAdminAuth.salt = salt;
currentAdminAuth.isCustomized = true;
currentAdminAuth.updatedAt = new Date().toISOString();

fs.writeFileSync('./data/admin_auth.json', JSON.stringify(currentAdminAuth, null, 2), 'utf-8');
console.log('Admin auth updated!');
