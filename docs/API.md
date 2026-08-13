# Beauty Center — API Reference

Base URL: `http://localhost:4000/api` (dev) · `https://<your-api>/api` (prod)

All responses follow:

```json
{ "success": true, "message": "OK", "data": { } }
```

Errors:

```json
{ "success": false, "message": "Reason", "errors": [] }
```

Auth: send `Authorization: Bearer <accessToken>`. Access tokens are short-lived; use `/auth/refresh` (httpOnly cookie) to rotate.

---

## Auth

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/auth/register` | — | `firstName, lastName, email, password, phone?` |
| POST | `/auth/login` | — | `email, password` |
| POST | `/auth/refresh` | cookie | — |
| POST | `/auth/logout` | ✓ | — |
| GET | `/auth/me` | ✓ | — |
| PATCH | `/auth/profile` | ✓ | `firstName?, lastName?, phone?` |
| POST | `/auth/change-password` | ✓ | `currentPassword, newPassword` |
| POST | `/auth/forgot-password` | — | `email` |
| POST | `/auth/reset-password` | — | `token, password` |

## Products

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/products` | — | `page, limit, search, categoryId, brandId, minPrice, maxPrice, sortBy, sortOrder, inStock, onSale, featured` |
| GET | `/products/slug/:slug` | — | full detail + related |
| GET | `/products/:id` | — | by id |
| GET | `/products/admin/all` | Admin | includes archived/inactive |
| POST | `/products` | Admin | create |
| PATCH | `/products/:id` | Admin | update |
| POST | `/products/:id/archive` | Admin | soft archive |
| POST | `/products/:id/restore` | Admin | restore |
| DELETE | `/products/:id` | Admin | hard delete |

## Categories / Brands

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/categories` · `/categories/slug/:slug` | — |
| POST · PATCH · DELETE | `/categories`, `/categories/:id` | Admin |
| GET | `/brands` | — |
| POST · PATCH · DELETE | `/brands`, `/brands/:id` | Admin |

## Cart

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| GET | `/cart` | ✓ | — |
| POST | `/cart` | ✓ | `productId, quantity` |
| PATCH | `/cart/:itemId` | ✓ | `quantity` |
| DELETE | `/cart/:itemId` | ✓ | — |
| DELETE | `/cart` | ✓ | clear |

## Orders

| Method | Endpoint | Auth | Body |
|--------|----------|------|------|
| POST | `/orders/checkout` | ✓ | `paymentMethod, shipping, couponCode?, notes?` |
| GET | `/orders` | ✓ | my orders |
| GET | `/orders/:id` | ✓ | detail + history |
| POST | `/orders/:id/cancel` | ✓ | while PENDING |
| GET | `/orders/admin/all` | Admin | `page, status, search` |
| GET | `/orders/admin/:id` | Admin | detail |
| PATCH | `/orders/admin/:id/status` | Admin | `status` |

## Reviews · Wishlist · Coupons

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/reviews` · `/reviews/me` | — / ✓ |
| POST · PATCH · DELETE | `/reviews`, `/reviews/:id` | ✓ (owner) |
| GET | `/reviews/admin/all` · PATCH `/reviews/admin/:id/approval` | Admin |
| GET · POST · DELETE | `/wishlist`, `/wishlist/:productId` | ✓ |
| POST | `/wishlist/:productId/move-to-cart` | ✓ |
| POST | `/coupons/validate` | ✓ · `code, subtotal` |
| CRUD | `/coupons` | Admin |

## Support · Notifications · Misc

| Method | Endpoint | Auth |
|--------|----------|------|
| GET · POST | `/support`, `/support/:id/reply` | ✓ |
| GET | `/support/admin/all` · `/support/admin/:id` · reply · status | Admin |
| GET | `/notifications` · `/notifications/unread-count` | ✓ |
| PATCH | `/notifications/:id/read` · `/notifications/read-all` | ✓ |
| POST | `/notifications/admin/send` | Admin |
| GET | `/stats/dashboard` · `/stats/detailed` | Admin |
| POST | `/newsletter/subscribe` | — |
| POST | `/uploads/images` | Admin · multipart `images[]` |
| GET · PUT | `/settings/public`, `/settings/site`, `/settings/commerce` | —/Admin |
| CRUD | `/addresses` | ✓ |
| GET | `/customers/admin` · `/customers/admin/:id` | Admin |

---

## Rate limits

- Global: 100 req / 15 min per IP
- Auth endpoints: 10 req / 15 min per IP

## Status codes

`200` OK · `201` Created · `400` Validation · `401` Unauthenticated · `403` Forbidden · `404` Not found · `409` Conflict · `429` Rate limited · `500` Server error
