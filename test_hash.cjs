const crypto = require('crypto');
const salt = '5a460d1ec83afd71449a06a9b4f494d1';
const hash = crypto.pbkdf2Sync('ChanDdara2020!@#', salt, 100000, 64, 'sha512').toString('hex');
console.log(hash);
