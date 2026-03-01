// api/images.js
// GET    /api/images?category=&status=live&page=0&limit=50  → { images, total }
// PATCH  /api/images?id=  { status }                       → { image }  (auth required)
// DELETE /api/images?id=                                   → { success }  (auth required)

const { verifyRequest } = require('../lib/auth');
const { deleteFromCloudinary } = require('../lib/cloudinary');
const { getDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const db = getDB();

  // ─────────────────────────────────────────────────────
  // GET — public, no auth
  // ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const {
      category, status = 'live',
      page = '0', limit = '50',
      search = ''
    } = req.query;

    const pg  = Math.max(0, parseInt(page) || 0);
    const lim = Math.min(100, parseInt(limit) || 50);
    const from = pg * lim;
    const to   = from + lim - 1;

    let query = db.from('images').select('*', { count: 'exact' });

    // Filters
    if (status !== 'all') query = query.eq('status', status);
    if (category)         query = query.eq('category', category);
    if (search)           query = query.ilike('title', `%${search}%`);

    // Pagination + order
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ images: data || [], total: count || 0, page: pg, limit: lim });
  }

  // ─────────────────────────────────────────────────────
  // PATCH / DELETE — admin auth required
  // ─────────────────────────────────────────────────────
  try { verifyRequest(req); }
  catch(e) { return res.status(401).json({ error: 'Unauthorized' }); }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Image id required' });

  // ── PATCH: toggle/set status ─────────────────────────
  if (req.method === 'PATCH') {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status field required' });
    const { data, error } = await db
      .from('images').update({ status }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ image: data });
  }

  // ── DELETE ───────────────────────────────────────────
  if (req.method === 'DELETE') {
    // Get record first to get public_id
    const { data: img, error: fetchErr } = await db
      .from('images').select('public_id').eq('id', id).single();
    if (fetchErr) return res.status(404).json({ error: 'Image not found' });

    // Delete from Cloudinary
    if (img?.public_id) {
      try { await deleteFromCloudinary(img.public_id); }
      catch(e) { /* log but continue */ console.error('Cloudinary delete failed:', e.message); }
    }

    // Delete from DB
    const { error } = await db.from('images').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
