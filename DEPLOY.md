# 🌸 Shayari Gallery v2 — Production Deployment Guide
## Zero localStorage · Real Cloudinary CDN · Supabase PostgreSQL · $0/month

---

## Architecture

```
Browser (Visitor)           Browser (You)
        │                        │
        ▼                        ▼
   index.html               admin.html
 (Gallery, public)       (Dashboard, password)
        │                        │
        └──────────┬─────────────┘
                   ▼
            Vercel Free Tier
         ┌──────────────────────────┐
         │  GET  /api/images        │  ← Returns live images
         │  GET  /api/categories    │  ← Returns categories
         │  POST /api/auth          │  ← Verifies bcrypt hash
         │  POST /api/upload        │  ← Admin: upload image
         │  DELETE /api/images?id=  │  ← Admin: delete
         └───────┬──────────────────┘
                 │
       ┌─────────┴──────────┐
       ▼                    ▼
  Cloudinary (Free)    Supabase (Free)
  Image CDN storage    PostgreSQL DB
  25 GB / month        500 MB · 50k req/day
```

---

## Step 1 — Supabase Setup (Free)

1. Go to **https://supabase.com** → Sign Up → New Project (free tier)
2. Open **SQL Editor → New Query**
3. Paste the entire contents of **`supabase-schema.sql`** → click **Run**
4. Go to **Settings → API** and copy:
   - **Project URL**: `https://xxxx.supabase.co`
   - **service_role** secret key (the one labeled "service_role", NOT anon)

---

## Step 2 — Cloudinary Setup (Free)

1. Go to **https://cloudinary.com** → Sign Up → Free tier
   - Gives you: 25 GB storage, 25 GB CDN bandwidth/month
2. From the Dashboard copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

---

## Step 3 — Generate Admin Password Hash

Run this ONE TIME on your local machine (Node.js required):

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YOUR_STRONG_PASSWORD', 12))"
```

This outputs something like: `$2b$12$abcdefghijklmnopqrstuuXYZ...`

Save this hash — it's your `ADMIN_PASSWORD_HASH`.

> ⚠️ The raw password is NEVER stored anywhere. Only the bcrypt hash goes in env vars.

---

## Step 4 — Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# In your project folder
npm install
vercel login
vercel --prod
```

Or: Push to GitHub → Import at **vercel.com/new** → auto-deploys on every push.

---

## Step 5 — Set Environment Variables

In **Vercel Dashboard → Your Project → Settings → Environment Variables**:

| Variable | Value | Note |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | From Supabase Settings |
| `SUPABASE_SERVICE_KEY` | `eyJ…` (service_role key) | Keep secret — server only |
| `CLOUDINARY_CLOUD_NAME` | `your-cloud-name` | From Cloudinary |
| `CLOUDINARY_API_KEY` | `123456789012345` | From Cloudinary |
| `CLOUDINARY_API_SECRET` | `abc123…` | Keep secret |
| `ADMIN_PASSWORD_HASH` | `$2b$12$…` | Output from Step 3 |
| `JWT_SECRET` | Any random 32+ char string | e.g. `openssl rand -hex 32` |

After adding vars → **Redeploy** the project.

---

## Step 6 — Test Everything

1. Visit `https://your-project.vercel.app/api/config` → should show `"cloudinaryReady":true,"supabaseReady":true`
2. Visit `https://your-project.vercel.app/admin` → login with your password
3. Upload a test image → check gallery at `https://your-project.vercel.app`

---

## File Structure

```
/
├── index.html              ← Public gallery
├── admin.html              ← Admin dashboard
├── supabase-schema.sql     ← Run once in Supabase SQL Editor
├── vercel.json             ← Routing + headers
├── package.json            ← Dependencies
├── lib/
│   ├── auth.js             ← JWT sign/verify
│   ├── db.js               ← Supabase client
│   └── cloudinary.js       ← Upload/delete helpers
└── api/
    ├── auth.js             ← POST /api/auth
    ├── upload.js           ← POST /api/upload
    ├── images.js           ← GET/PATCH/DELETE /api/images
    ├── categories.js       ← CRUD /api/categories
    └── config.js           ← GET /api/config
```

---

## Adding New Categories (No Code Required!)

1. Log into Admin Panel → **Categories** tab
2. Fill in Name, Urdu Name, Slug, Emoji
3. Click **Add Category**
4. Category instantly appears in gallery and upload form!

---

## Security Model

| What | How |
|---|---|
| Admin password | bcrypt hash in env var — never in code or browser |
| Sessions | JWT token in sessionStorage — expires 24h |
| Upload API | Requires valid JWT — returns 401 otherwise |
| Image reads | Public — no auth (gallery is public) |
| Supabase key | `service_role` key — server-side only (env var) |
| Browser | Zero sensitive data stored in localStorage or cookies |

---

## Cost Breakdown

| Service | Free Tier Limit | Typical Usage |
|---|---|---|
| **Vercel** | 100 GB/month bandwidth | ✅ Well within |
| **Cloudinary** | 25 GB storage, 25 GB bandwidth | ✅ ~1000+ images |
| **Supabase** | 500 MB DB, 50k requests/day | ✅ Years of data |
| **Total** | | **$0/month** |

---

## Future Upgrades (Architecture is Ready)

- **AdSense**: Replace `.ad-slot` divs in `index.html`
- **More categories**: Add via Admin Panel — no code needed
- **User accounts**: Extend `api/auth.js` with Supabase Auth
- **Premium content**: Add `premium: boolean` column to images table
