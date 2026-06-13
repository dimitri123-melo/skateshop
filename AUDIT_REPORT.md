# Skateshop — Full Project Audit Report

## 1. Executive Summary

The skateshop codebase is a **~2-year-old Next.js 14 e-commerce starter** with 304 source files. It has solid architectural foundations (App Router, server actions, Drizzle ORM, Clerk auth, Stripe Connect) but suffers from **outdated dependencies, abandoned libraries, incomplete features, security gaps, and broken database queries**.

**Critical blockers**: Contentlayer is abandoned; a cart query uses MySQL syntax on PostgreSQL (broken); Clerk is 2 major versions behind; no RBAC exists; Stripe Checkout is incomplete.

---

## 2. Stack Version Analysis

| Technology | Current | Latest | Status |
|---|---|---|---|
| Next.js | 14.2.5 | 15.x | ⚠️ Major version behind |
| React | 18.3.1 | 19.x | ⚠️ Major version behind |
| TypeScript | 5.5.3 | 5.8.x | ⚠️ Behind |
| Drizzle ORM | 0.32.0 | 0.43.x | ⚠️ Behind |
| @clerk/nextjs | 5.2.3 | 7.5.x | 🔴 2 major versions behind |
| Stripe SDK | 16.2.0 | 17.x+ | ⚠️ Behind |
| Tailwind CSS | 3.4.4 | 4.x | ⚠️ Major version behind |
| Uploadthing | 6.13.2 | 7.x+ | ⚠️ Behind |
| **Contentlayer** | 0.3.4 | — | 🔴 **ABANDONED/DEPRECATED** |
| @tremor/react | 3.17.4 | — | ⚠️ Heavy, consider replacing |
| shadcn/ui | old | current | ⚠️ Needs refresh |

---

## 3. Critical Issues

### 3.1 Contentlayer is Abandoned
The `contentlayer` package is unmaintained. It blocks builds on newer Node versions and has known compatibility issues. Must migrate to an alternative (e.g., `velite`, `fumadocs`, or `@content-collections/core`).

### 3.2 Broken Database Query
`src/lib/actions/cart.ts` → `getUniqueStoreIds()` uses `JSON_CONTAINS()` which is **MySQL syntax, not PostgreSQL**. This function is broken on the PostgreSQL database this project uses.

### 3.3 Build Safety Disabled
`next.config.js` has both `eslint: { ignoreDuringBuilds: true }` and `typescript: { ignoreBuildErrors: true }`. This hides errors in production builds.

### 3.4 No Role-Based Access Control
- Middleware only protects `/dashboard(.*)` routes
- No admin/seller/customer role distinction
- Server actions don't consistently verify authorization
- `createStore` accepts `userId` as input (should derive from auth)

### 3.5 Stripe Checkout Incomplete
README marks "Checkout with Stripe Checkout" as unfinished. The current implementation uses Payment Intents directly but lacks:
- Proper checkout session flow
- Refund workflows
- Failed payment retry handling
- Customer portal integration

---

## 4. Database Schema Analysis

### Existing Tables (13)
addresses, carts, categories, customers, notifications, orders, payments, products, stocks, stores, subcategories, tags, variants

### Issues
- **Cart items stored as JSON** — no relational `cart_items` table; prevents proper inventory validation
- **Order items stored as JSON** — no `order_items` table; prevents order-level querying
- **No user association on carts** — relies solely on cookies
- **No reviews/ratings tables** — `rating` is a simple integer on products (no user attribution)
- **Missing tables**: wishlists, audit_logs, transactions, reviews
- **Addresses not linked to users** — no userId column
- **No composite indexes** on frequently filtered combinations

### What Works
- Proper foreign keys with cascade deletes
- Relations defined for Drizzle query API
- Indexes on major foreign keys
- Enum types for product status and store plan
- Lifecycle dates (createdAt/updatedAt) via shared utility

---

## 5. Authentication & Security

### Current State
- Clerk handles auth with middleware protecting `/dashboard`
- User metadata stores Stripe subscription info
- Cookie-based cart (no auth required for shopping)

### Gaps
- **No RBAC** — no admin role, no seller verification on store operations
- **Server actions inconsistently check auth** — `deleteStore` checks `auth()`, but `updateStore` does not
- **OpenAI key accessed via `process.env`** directly (bypasses t3-env validation)
- **Client secret stored in cart table** — potential exposure
- **No CSRF protection** beyond Next.js defaults
- **No input sanitization** on user-generated content (product descriptions, store names)
- **Rate limiting exists** (Upstash) but not applied to most endpoints

---

## 6. API & Server Actions Architecture

### Pattern
Server actions in `src/lib/actions/` handle mutations. Queries in `src/lib/queries/` handle reads with caching via `unstable_cache`.

### Issues
- `unstable_noStore` is deprecated in Next.js 15 (use `connection()` or `noStore` from next/cache)
- Error handling swallows errors silently (returns `[]` or `null`)
- No structured logging (only `console.log`)
- No request/response type safety between client and server
- Stripe webhook handler has no idempotency checks

---

## 7. UI/UX Assessment

### Current State
- shadcn/ui components (37 UI components)
- Dark/light mode via next-themes
- Loading skeletons on most pages
- @tremor/react for analytics charts
- Framer Motion for some animations
- Basic responsive layout

### Gaps
- Analytics dashboard is barebones (placeholder data)
- No empty states for many list pages
- Error states show raw error text
- Product search is basic (no full-text, no autocomplete)
- Checkout flow is functional but visually rough
- Dashboard sidebar is minimal
- No mobile-optimized navigation patterns
- No accessibility audit (missing aria labels, keyboard nav)

---

## 8. Performance

### Issues
- Multiple `unstable_noStore()` calls preventing any caching
- Product listing uses transaction for count + data (could be parallel)
- Cart fetches join 4 tables per request
- No image optimization strategy (unoptimized: true in config)
- No ISR/SSG for static pages (products, categories)
- Bundle includes heavy deps (@tremor, framer-motion, openai)
- Contentlayer build adds significant overhead

---

## 9. Missing Features Summary

### From README (explicitly marked incomplete)
- [ ] Stripe Checkout
- [ ] Admin dashboard
- [ ] Payment management (partial)

### From analysis
- [ ] Customer order tracking
- [ ] Product reviews & ratings (proper system)
- [ ] Wishlists / saved items
- [ ] Full-text search with autocomplete
- [ ] Product recommendations
- [ ] Recently viewed products
- [ ] Email notifications (transactional)
- [ ] Seller analytics (real data)
- [ ] Inventory management UI
- [ ] Refund/return workflows
- [ ] Audit logging
- [ ] User profile management

---

## 10. Recommended Priority Order

1. **Replace Contentlayer** — blocking issue for modernization
2. **Fix broken queries** — `getUniqueStoreIds` MySQL syntax
3. **Upgrade Clerk** — 2 major versions behind, API changes needed
4. **Upgrade Next.js to 15** — enables modern caching APIs
5. **Add RBAC** — foundational for all feature work
6. **Database schema expansion** — reviews, wishlists, order_items, audit_logs
7. **Complete Stripe flows** — checkout, refunds, customer portal
8. **Implement missing features** — orders, admin, analytics
9. **UI/UX overhaul** — premium design, accessibility, responsive
10. **Performance optimization** — caching, ISR, bundle splitting
