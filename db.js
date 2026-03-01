// lib/db.js — Supabase client
// Supabase free tier: 500MB DB, 1GB file storage, 2GB bandwidth
const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getDB() {
  if (_client) return _client;
  const url   = process.env.SUPABASE_URL;
  const key   = process.env.SUPABASE_SERVICE_KEY; // service role key (server-only)
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY env vars required');
  _client = createClient(url, key, {
    auth: { persistSession: false }
  });
  return _client;
}

module.exports = { getDB };
