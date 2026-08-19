# RA — Own Your Presence.

A production-grade, full-stack e-commerce application for **RA**, a Pakistani
premium fragrance brand. Built with security as the #1 priority.

---

## Tech stack

| Layer      | Technology |
| ---------- | ------------------------------------------------------------ |
| Frontend   | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS |
| UI         | shadcn/ui-style components (hand-rolled primitives + lucide) |
| Forms      | React Hook Form + Zod |
| Backend    | Next.js route handlers (secure server APIs) |
| ORM        | Prisma (PostgreSQL) |
| Database   | PostgreSQL — locally via **PGlite** (a real PostgreSQL 16 engine compiled to WASM, exposed over the wire protocol), or any managed PostgreSQL in production |
| Auth       | DB-backed sessions, HttpOnly/SameSite cookies, bcrypt password hashing |
| Storage    | Local filesystem (default) or S3-compatible object storage |
| Email      | Console (dev) or SMTP |
| Tests      | Vitest (37 tests covering auth, authz, products, orders, coupons, security) |

---

## Quick start (local, fully offline)

```bash
npm install            # installs deps + generates the Prisma client
npm run db:server      # starts PostgreSQL (PGlite) on 127.0.0.1:5432
npm run db:init        # applies the schema
npm run db:seed        # seeds admin, customer, products, categories, coupon
npm run dev            # http://localhost:3000
```

Useful scripts:

```bash
npm run db:reset       # drop + recreate + reseed
npm run db:studio      # prisma studio (needs network for engine binaries)
npm test               # run the test suite (isolated in-memory test DB on :5433)
npm run build          # production build
npm run lint           # eslint
```

### Default accounts (seed)

| Role     | Email                   | Password      |
| -------- | ----------------------- | ------------- |
| Admin    | `admin@ra-fragrances.pk` | `Admin@12345` |
| Customer | `ayesha@example.com`    | `Customer@123` |

> Change the seed password via `ADMIN_SEED_PASSWORD` before any real deployment.

---

## A note on the local database + Prisma offline workaround

`binaries.prisma.sh` (Prisma's native engine host) is unreachable in
fully-offline sandboxes, so:

- `scripts/generate.mjs` points `PRISMA_SCHEMA_ENGINE_BINARY` at a local
  placeholder (`prisma/.schema-engine-placeholder`). `prisma generate` only
  checks that a path exists — generation itself uses the WASM schema parser —
  so this lets the typed client be produced with zero network. **On a normal
  machine you can ignore this** and run `npx prisma generate` directly.
- The runtime uses Prisma's driver adapter (`@prisma/adapter-pg` → `pg`) with
  the WASM query compiler — no native engine needed at runtime.
- Migrations are applied from `prisma/migrations/0001_init/migration.sql`
  (Prisma-convention PostgreSQL DDL) via `npm run db:init`. On a networked
  machine you can use `npx prisma migrate deploy` against a real PostgreSQL
  instead — the DDL matches the Prisma schema exactly.

In **production**, point `DATABASE_URL` at a managed PostgreSQL 16 instance
(see `docker-compose.yml`), raise the connection pool size in `src/lib/db.ts`,
and use S3 + SMTP + real rate-limit storage (Redis) as described below.

---

## Security model

Security is enforced at every layer — never only in the UI.

- **Authentication** — bcrypt-hashed passwords (never plaintext), DB-backed
  sessions storing only a SHA-256 digest of a high-entropy token, HttpOnly +
  SameSite=Lax cookies, email verification, single-use password-reset tokens
  with expiry.
- **Authorization** — every protected API verifies authentication, role,
  resource ownership and permission server-side (`requireUser` /
  `requireAdmin` + explicit ownership `where` clauses). IDOR-protected
  (customers can only read their own orders/addresses/reviews).
- **Price manipulation** — checkout sends only `{ productId, quantity,
  couponCode, address }`. The server loads authoritative prices/stock, applies
  coupon + shipping rules, and computes the total. Nothing price-related is
  trusted from the client.
- **Overselling** — stock is decremented atomically inside a transaction with a
  `WHERE quantity >= qty` guard; a cancelled order restocks with an audited
  inventory transaction.
- **CSRF** — `SameSite=Lax` cookies plus server-side `Origin` verification for
  every state-changing request.
- **Rate limiting + brute-force** — sliding-window rate limits (stricter for
  auth/checkout/coupon/review/contact) and exponential lockout after repeated
  login failures.
- **Uploads** — extension + MIME + magic-byte verification, size limits,
  random renaming, path-traversal-safe serving.
- **Headers** — CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `poweredByHeader: false`.
- **Error handling** — customers see only "Something went wrong. Please try
  again."; details are logged server-side.
- **Audit logging** — admin logins, product create/update/archive/delete, price
  changes, inventory adjustments, order status changes, coupon changes, review
  moderation and customer changes are recorded with admin, entity, IP and UA
  (never passwords or tokens).
- **Data integrity** — FKs, unique constraints, indexes, transactions, soft
  delete/archive for products & customers, controlled permanent deletion only
  when no dependent records exist.

### Production hardening checklist

- Run behind HTTPS with a valid certificate.
- Set a strong `AUTH_SECRET` and `PASSWORD_HASH_COST=12+`.
- Use managed PostgreSQL + `prisma migrate deploy`; enable automated backups.
- Use `STORAGE_DRIVER=s3` and `EMAIL_DRIVER=smtp`.
- Swap the in-memory rate limiter/brute-force for Redis in multi-instance.
- Add `frame-ancestors 'self'` to the CSP (omitted here so the dev preview
  proxy can embed the app) and monitor failed logins via the audit log.

---

## Features

**Storefront** — home (hero, featured, brand story, why-RA, trust), shop with
search/filter/sort/pagination, product pages with gallery + zoom, fragrance
quiz, cart drawer, COD checkout, order confirmation + tracking, about, contact,
FAQ, legal pages, SEO (metadata, product/organisation/breadcrumb JSON-LD,
sitemap, robots).

**Customer portal** — register/login/logout, forgot/reset password, email
verification, profile, orders + order details, addresses, reviews (verified
purchase only), account settings.

**Admin** — dashboard + analytics (revenue/orders over time, top products,
status distribution), product CRUD (soft delete/archive/restore), category
CRUD, inventory management with full transaction history and low-stock alerts,
order management (status, notes, invoice data, cancel→restock), customer
management (deactivate/anonymise), coupon CRUD, review moderation, audit logs,
store settings (shipping rules, free-shipping threshold, socials, maintenance
mode).

---

## Project structure

```
prisma/               schema + migration.sql + seed
scripts/              DB orchestration + offline generate helper
src/
  app/                pages (storefront, account, admin) + API route handlers
  components/         ui/ primitives, store/ and admin/ components
  lib/
    auth.ts           sessions + password hashing
    auth-service.ts   register/login/reset/verify flows
    route-helpers.ts  guards, ApiError, JSON helpers, error mapping
    security/         rate limiting, brute force, tokens, request meta
    services/         product, category, inventory, cart, checkout, order,
                      coupon, review, quiz, analytics, customer
    storage/          storage providers + file validation
    email/            email providers + templates
    payment/          payment provider interface (COD implemented)
    validation/       Zod schemas (server-side source of truth)
tests/                Vitest suite (isolated test database)
```

---

## Currency

All money is stored as whole Pakistani Rupees (integers) to avoid floating-point
drift and formatted as `PKR 1,890`. Prices are never hardcoded in UI
components — they always come from the database through the API.
