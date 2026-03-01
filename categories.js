// api/categories.js
// GET    /api/categories          → all active categories (public)
// POST   /api/categories          → create category (auth)
// PATCH  /api/categories?id=      → update (auth)
// DELETE /api/categories?id=      → delete (auth)

const { verifyRequest } = require('../lib/auth');
const { getDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDB();

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ categories: data || [] });
  }

  // Auth for mutations
  try { verifyRequest(req); }
  catch(e) { return res.status(401).json({ error: 'Unauthorized' }); }

  if (req.method === 'POST') {
    const { name, name_urdu, slug, emoji, description, sort_order } = req.body || {};
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });
    const { data, error } = await db.from('categories')
      .insert({ name, name_urdu, slug, emoji: emoji||'📂', description, sort_order: sort_order||99, active: true })
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ category: data });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id required' });

  if (req.method === 'PATCH') {
    const { data, error } = await db.from('categories')
      .update(req.body).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ category: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await db.from('categories').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
