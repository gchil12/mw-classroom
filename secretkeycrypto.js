const crypto = require('crypto');

// Generate a secure random key (32 bytes = 256 bits)
const secretKey = crypto.randomBytes(32).toString('hex');

console.log('Generated Secret Key:', secretKey);
