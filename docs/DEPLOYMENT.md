# Beauty Center — Deployment Guide

Free-tier stack: **Vercel** (frontend) + **Render** (backend) + **Supabase** (Postgres + storage).

---

## 1. Supabase (database + storage)

1. Create a project at [supabase.com](https://supabase.com).
2. **Settings → Database → Connection string**: copy both the pooled (`?pgbouncer=true`, port 6543) and direct (port 5432) URLs.
   - `DATABASE_URL` → pooled
   - `DIRECT_URL` → direct
3. **Storage → Create bucket** named `beauty-center`, set it **Public**.
4. **Settings → API**: copy `Project URL`, `anon` key, and `service_role` key.

---

## 2. Backend (Render)

1. Push the repo to GitHub.
2. On [render.com](https://render.com) → **New → Web Service** → connect the repo. Render auto-detects `backend/render.yaml`.
3. Set **Root Directory** to `backend`.
   - Build: `npm install && npx prisma generate && npm run build`
   - Start: `npm run start`
   - Pre-deploy / one-time: `npx prisma migrate deploy` (add `npm run seed` once for demo data)
4. Add environment variables (see `backend/.env.example`):
   ```
   NODE_ENV=production
   DATABASE_URL=...            # pooled
   DIRECT_URL=...              # direct
   JWT_ACCESS_SECRET=...       # 32+ random chars
   JWT_REFRESH_SECRET=...
   JWT_RESET_SECRET=...
   COOKIE_SECRET=...
   COOKIE_SECURE=true
   CLIENT_URL=https://<your-vercel-app>.vercel.app
   CORS_ORIGINS=https://<your-vercel-app>.vercel.app
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_STORAGE_BUCKET=beauty-center
   ```
5. Deploy. Health check: `GET https://<your-api>/api/health`.

> Render free tier sleeps after 15 min idle — first request after sleep is slow. That's expected.

---

## 3. Frontend (Vercel)

1. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
2. Set **Root Directory** to `frontend`. Framework preset: **Next.js**.
3. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://<your-api>/api
   NEXT_PUBLIC_SITE_URL=https://<your-vercel-app>.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Deploy. Vercel builds and serves automatically on every push.

---

## 4. Post-deploy checklist

- [ ] `GET /api/health` returns `{ success: true }`
- [ ] Register a user → confirm it lands in Supabase `User` table
- [ ] Log in as seeded admin (`admin@beautycenter.com` / `Admin@12345`) → change the password immediately
- [ ] Upload a product image → confirm it appears in the Supabase bucket
- [ ] Place a COD order → confirm status transitions work in the admin panel
- [ ] `CORS_ORIGINS` on the backend exactly matches the Vercel URL (no trailing slash)
- [ ] `COOKIE_SECURE=true` in production so refresh cookies are HTTPS-only

---

## 5. Local Docker (optional)

```bash
cd backend
docker build -t beauty-center-api .
docker run -p 4000:4000 --env-file .env beauty-center-api
```

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `P1001 can't reach database` | Check `DATABASE_URL` / that Supabase project isn't paused |
| CORS error in browser | `CORS_ORIGINS` must match frontend origin exactly |
| 401 loops on refresh | Ensure cookies allowed cross-site; `COOKIE_SECURE=true` + HTTPS |
| Images 403 | Supabase bucket must be **public** |
| Migrations fail on Render | Use `DIRECT_URL` (port 5432), not the pooled URL, for migrations |
