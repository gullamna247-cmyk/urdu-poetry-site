// api/auth.js
// POST /api/auth  { password } → { token }
// Password is compared server-side using bcrypt.
// The plaintext password NEVER exists in the frontend.
//
// To set your password:
//   1. Run:  node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR_PASSWORD',12))"
//   2. Set ADMIN_PASSWORD_HASH=<output> in Vercel env vars

const bcrypt = require('bcryptjs');
const { signToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // Helpful error during first-time setup
    return res.status(500).json({
      error: 'ADMIN_PASSWORD_HASH env var not set. See DEPLOY.md for setup instructions.'
    });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    // Generic message — don't reveal why it failed
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ role: 'admin' });
  return res.status(200).json({ token });
};
