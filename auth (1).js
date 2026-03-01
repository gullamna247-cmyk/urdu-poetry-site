// lib/auth.js — server-side JWT helpers
const jwt = require('jsonwebtoken');

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var not set');
  return s;
}

/** Sign a token valid for 24 hours */
function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' });
}

/** Verify token from Authorization header. Returns payload or throws. */
function verifyRequest(req) {
  const header = req.headers['authorization'] || '';
  if (!header.startsWith('Bearer ')) throw new Error('Missing token');
  const token = header.slice(7);
  return jwt.verify(token, getSecret()); // throws if invalid/expired
}

module.exports = { signToken, verifyRequest };
