# Beauty Center — Architecture & Folder Structure

## Overview

Monorepo with two independent apps. Backend follows **Clean Architecture**: each domain module is split into
`routes → controller → service → repository`, with DTOs (Zod), a shared error layer, and dependency-injected services.

```
beauty-center/
├── backend/          Express + Prisma REST API
├── frontend/         Next.js 15 App Router storefront + admin
├── docs/             API, deployment, architecture
└── README.md
```

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma      All models (User, Product, Order, ...)
│   └── seed.ts            Admin user + demo catalog
├── src/
│   ├── config/            env, logger, prisma client, supabase
│   ├── middleware/        auth (JWT + role), error handler, rate limiter, validate, upload
│   ├── modules/           one folder per domain:
│   │   └── <domain>/
│   │       ├── *.routes.ts        HTTP routes
│   │       ├── *.controller.ts    req/res, calls service
│   │       ├── *.service.ts       business logic
│   │       ├── *.repository.ts    Prisma data access
│   │       └── *.dto.ts           Zod schemas
│   ├── services/          cross-cutting: payment (abstraction), notifications, storage
│   ├── routes/            root router mounting all modules
│   ├── utils/             ApiResponse, asyncHandler, errors, jwt, password
│   ├── app.ts             Express app assembly (helmet, cors, compression)
│   └── server.ts          bootstrap + graceful shutdown
├── Dockerfile
└── render.yaml
```

### Request flow

```
HTTP → route → validate(DTO) → controller → service → repository → Prisma → DB
                                     ↑ throws AppError → error middleware → JSON
```

### Payment abstraction

`services/payment/` defines a `PaymentProvider` interface and a registry. `CashOnDelivery` is the only
concrete provider today; adding Stripe/PayPal means implementing the interface and registering it —
no changes to the order flow.

## Frontend

```
frontend/src/
├── app/
│   ├── layout.tsx              root: fonts, providers, Toaster, dir=rtl/ltr
│   ├── (store)/                public storefront (grouped route, shared Navbar/Footer)
│   │   ├── page.tsx            home (hero, featured, best sellers, flash sale...)
│   │   ├── products/           listing + [slug] detail
│   │   ├── categories/         listing + [slug]
│   │   ├── cart, checkout, order-success, wishlist
│   │   ├── login, register, forgot-password, reset-password
│   │   ├── about, contact, privacy, terms
│   │   └── dashboard/          customer area (orders, reviews, wishlist, addresses, support, notifications)
│   ├── admin/                  admin panel (dashboard, products, orders, customers, coupons, categories, brands, reviews, support, notifications, settings, stats)
│   ├── sitemap.ts, robots.ts, manifest.ts, not-found.tsx
├── components/
│   ├── ui/                     shadcn-style primitives (button, card, dialog, select, ...)
│   ├── layout/                 Navbar, Footer
│   ├── home/                   HeroSlider, FeaturedProducts, FlashSale, Testimonials, ...
│   ├── product/                ProductCard, ProductGrid
│   ├── dashboard/              DashboardSidebar
│   ├── admin/                  AdminSidebar, ProductForm
│   └── providers.tsx           Theme + Auth + Cart + Wishlist providers
├── contexts/                   AuthContext, CartContext, WishlistContext
├── hooks/                      use-toast
├── i18n/                       next-intl request config
├── lib/                        api.ts (axios + refresh interceptor), utils.ts
├── messages/                   en.json, ar.json
└── types/                      shared TS interfaces
```

### State

- **Server data**: fetched via `lib/api.ts` (axios). Access token in memory/localStorage; refresh via httpOnly cookie with an interceptor that retries once on 401.
- **Client state**: React Context — `AuthContext` (session), `CartContext`, `WishlistContext`.
- **Theme**: `next-themes` (system/light/dark). **i18n**: `next-intl` (en/ar), direction set on `<html>`.

## Design system

Soft-pink luxury palette via CSS variables in `globals.css` (light + dark). Tailwind maps them to
`primary`, `muted`, `card`, etc. Motion via Framer Motion; icons via lucide-react.
