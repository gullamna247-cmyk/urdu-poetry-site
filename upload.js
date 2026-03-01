// api/upload.js
// POST /api/upload  (multipart/form-data, Authorization: Bearer <token>)
// → Uploads image to Cloudinary, stores metadata in Supabase
// → Returns the new image record

const multiparty = require('multiparty');
const fs = require('fs');
const { verifyRequest } = require('../lib/auth');
const { uploadToCloudinary } = require('../lib/cloudinary');
const { getDB } = require('../lib/db');

// Vercel: disable default body parser for file uploads
export const config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── 1. Auth ──────────────────────────────────────────
  try { verifyRequest(req); }
  catch(e) { return res.status(401).json({ error: 'Unauthorized: ' + e.message }); }

  // ── 2. Parse multipart form ──────────────────────────
  let fields, files;
  try {
    [fields, files] = await new Promise((resolve, reject) => {
      const form = new multiparty.Form({ maxFilesSize: 15 * 1024 * 1024 }); // 15 MB max
      form.parse(req, (err, f, fi) => err ? reject(err) : resolve([f, fi]));
    });
  } catch(e) {
    return res.status(400).json({ error: 'Failed to parse form: ' + e.message });
  }

  const file = files?.image?.[0];
  if (!file) return res.status(400).json({ error: 'No image file provided (field name: image)' });

  // ── 3. Extract metadata fields ───────────────────────
  const title    = (fields?.title?.[0] || '').trim();
  const author   = (fields?.author?.[0] || '').trim();
  const category = (fields?.category?.[0] || 'urdu-poetry').trim();
  const desc     = (fields?.description?.[0] || '').trim();
  const tagsRaw  = fields?.tags?.[0] || '[]';
  const status   = fields?.status?.[0] === 'draft' ? 'draft' : 'live';

  if (!title)    return res.status(400).json({ error: 'Title is required' });
  if (!category) return res.status(400).json({ error: 'Category is required' });

  let tags = [];
  try { tags = JSON.parse(tagsRaw); } catch(e) {}

  // ── 4. Upload to Cloudinary ──────────────────────────
  let cloudResult;
  try {
    cloudResult = await uploadToCloudinary(file.path, category);
  } catch(e) {
    fs.unlink(file.path, () => {});
    return res.status(500).json({ error: 'Cloudinary upload failed: ' + e.message });
  } finally {
    fs.unlink(file.path, () => {}); // always clean temp file
  }

  // ── 5. Store metadata in Supabase ────────────────────
  const db = getDB();
  const record = {
    title,
    author      : author || null,
    category,
    description : desc || null,
    tags,
    status,
    url         : cloudResult.url,
    public_id   : cloudResult.publicId,
    width       : cloudResult.width,
    height      : cloudResult.height,
    file_bytes  : cloudResult.bytes,
    file_format : cloudResult.format,
    views       : 0
    // created_at is set by Supabase default
  };

  const { data, error } = await db
    .from('images')
    .insert(record)
    .select()
    .single();

  if (error) {
    // Try to clean up Cloudinary if DB insert fails
    try {
      const { deleteFromCloudinary } = require('../lib/cloudinary');
      await deleteFromCloudinary(cloudResult.publicId);
    } catch(e) {}
    return res.status(500).json({ error: 'Database error: ' + error.message });
  }

  return res.status(200).json({ success: true, image: data });
};
