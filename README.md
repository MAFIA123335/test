# Beauty Center — Full Stack E-Commerce Platform

A production-ready luxury beauty e-commerce platform built with Next.js 15, Express.js, Prisma, and PostgreSQL.

> 🇪🇬 **بتتكلم عربي؟** ابدأ من ملف [`START-HERE.md`](./START-HERE.md) — شرح كامل خطوة بخطوة للتشغيل والنشر.

> **Zero-config startup:** the backend auto-runs migrations and seeds demo data on first boot,
> and generates its own JWT/cookie secrets if you don't provide them. The **only** value you must
> supply is a PostgreSQL `DATABASE_URL`. See [`START-HERE.md`](./START-HERE.md).

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animations)
- **React Hook Form** + **Zod** (forms & validation)
- **next-intl** (EN/AR localization)
- **next-themes** (dark/light mode)

### Backend
- **Node.js** + **Express.js**
- **Prisma ORM** + **PostgreSQL** (Supabase)
- **JWT** authentication (access + refresh tokens)
- **bcrypt** password hashing
- **Supabase Storage** (file uploads)

---

## Project Structure

```
beauty-center/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/          # env, logger, prisma, supabase
│   │   ├── middleware/       # auth, error, rate-limiter, validate
│   │   ├── modules/          # auth, product, category, brand, cart,
│   │   │                     # order, review, wishlist, coupon,
│   │   │                     # support, notification, settings,
│   │   │                     # upload, newsletter, stats, customer, address
│   │   ├── routes/           # index router
│   │   ├── utils/            # apiResponse, asyncHandler, errors
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── render.yaml
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (store)/      # public store pages
    │   │   └── admin/        # admin panel
    │   ├── components/
    │   │   ├── ui/           # shadcn-style components
    │   │   ├── layout/       # Navbar, Footer
    │   │   ├── home/         # HeroSlider, FeaturedProducts, etc.
    │   │   ├── product/      # ProductCard, ProductGrid
    │   │   ├── dashboard/    # DashboardSidebar
    │   │   └── admin/        # AdminSidebar
    │   ├── contexts/         # Auth, Cart, Wishlist
    │   ├── hooks/            # use-toast
    │   ├── i18n/             # next-intl request config
    │   ├── lib/              # api.ts (axios), utils.ts
    │   └── messages/         # en.json, ar.json
    └── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or Supabase project)
- Supabase account (storage)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/beauty-center.git
cd beauty-center

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Environment Variables

**Backend** — copy `backend/.env.example` to `backend/.env`:

```env
NODE_ENV=development
PORT=4000
API_PREFIX=/api

DATABASE_URL=postgresql://user:password@host:5432/beauty_center?schema=public
DIRECT_URL=postgresql://user:password@host:5432/beauty_center

JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_RESET_SECRET=your_reset_secret_min_32_chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

COOKIE_SECRET=your_cookie_secret
COOKIE_SECURE=false

CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=beauty-center
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup

Nothing to run manually — on first `npm run dev` (or first deploy) the backend automatically
applies migrations and seeds demo data if the database is empty. You only need a valid
`DATABASE_URL` in `backend/.env`.

To do it by hand instead (optional), set `AUTO_MIGRATE=false` / `AUTO_SEED=false` and run:

```bash
cd backend
npx prisma migrate deploy   # apply migrations
npm run seed                # seed demo data
```

### 4. Run Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Health check: http://localhost:4000/api/health

### Default Credentials

| Role     | Email                        | Password       |
|----------|------------------------------|----------------|
| Admin    | admin@beautycenter.com       | Admin@12345    |
| Customer | customer@beautycenter.com    | Customer@123   |

---

## API Documentation

### Base URL
```
http://localhost:4000/api
```

### Authentication
All protected routes require `Authorization: Bearer <token>` header.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Register new user |
| POST | /auth/login | — | Login |
| POST | /auth/logout | ✓ | Logout |
| POST | /auth/refresh | — | Refresh access token |
| GET | /auth/me | ✓ | Get current user |
| PATCH | /auth/profile | ✓ | Update profile |
| POST | /auth/forgot-password | — | Send reset email |
| POST | /auth/reset-password | — | Reset password |
| GET | /products | — | List products (filter/sort/paginate) |
| GET | /products/slug/:slug | — | Get product by slug |
| POST | /products | Admin | Create product |
| PATCH | /products/:id | Admin | Update product |
| DELETE | /products/:id | Admin | Delete product |
| GET | /categories | — | List categories |
| GET | /brands | — | List brands |
| GET | /cart | ✓ | Get cart |
| POST | /cart | ✓ | Add to cart |
| PATCH | /cart/:id | ✓ | Update quantity |
| DELETE | /cart/:id | ✓ | Remove item |
| POST | /orders/checkout | ✓ | Place order |
| GET | /orders | ✓ | My orders |
| GET | /orders/:id | ✓ | Order detail |
| POST | /orders/:id/cancel | ✓ | Cancel order |
| GET | /reviews | — | List reviews |
| POST | /reviews | ✓ | Create review |
| PATCH | /reviews/:id | ✓ | Update review |
| DELETE | /reviews/:id | ✓ | Delete review |
| GET | /wishlist | ✓ | Get wishlist |
| POST | /wishlist | ✓ | Add to wishlist |
| DELETE | /wishlist/:id | ✓ | Remove from wishlist |
| POST | /coupons/validate | ✓ | Validate coupon |
| GET | /stats/dashboard | Admin | Dashboard stats |
| GET | /notifications | ✓ | Get notifications |

---

## Deployment

### Backend (Render)

1. Push to GitHub
2. Create new Web Service on Render (or use the included `render.yaml` Blueprint)
3. Connect your repository
4. Set root directory to `backend`
5. Build command: `npm install && npx prisma generate && npm run build`
6. Start command: `node dist/server.js`
7. Set `DATABASE_URL` (the only required value). Secrets can be auto-generated by Render;
   migrations + seed run automatically on first boot.

Or use the included `render.yaml` for one-click Blueprint deploy.

### Frontend (Vercel)

1. Push to GitHub
2. Import project on Vercel
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy

### Database (Supabase)

1. Create a new Supabase project
2. Copy the connection strings to your backend `.env`
3. Create a storage bucket named `beauty-center`
4. Set bucket to public

---

## Features

- ✅ Full authentication (JWT, refresh tokens, password reset)
- ✅ Product catalog with categories, brands, tags, images
- ✅ Advanced filtering, sorting, search, pagination
- ✅ Shopping cart with coupon support
- ✅ Checkout with Cash on Delivery
- ✅ Order management with status tracking
- ✅ Verified purchase reviews
- ✅ Wishlist
- ✅ Customer dashboard
- ✅ Admin panel (products, orders, customers, coupons, reviews, support)
- ✅ Support ticket system
- ✅ Push notifications
- ✅ Newsletter subscription
- ✅ File uploads (Supabase Storage)
- ✅ EN/AR localization
- ✅ Dark/light theme
- ✅ Fully responsive
- ✅ SEO-ready (metadata, OG tags)
- ✅ Production Docker + Render config

---

## License

MIT
