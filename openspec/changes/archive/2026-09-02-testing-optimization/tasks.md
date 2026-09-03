# Tasks: Testing & Optimization

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–1150 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Backend unit tests + health + Logger + cache | PR 1 | `cd backend && npx jest --coverage` | N/A — unit tests only | Test files + cache.service.ts + health.controller.ts |
| 2 | Backend integration + compression + rate limit + cart batching | PR 2 | `cd backend && npx jest --config test/jest-e2e.json` | Supertest against TestingModule | main.ts changes + e2e specs + cart service |
| 3 | Frontend test infrastructure + component tests | PR 3 | `cd frontend && npx vitest run` | N/A — Vitest + jsdom | vitest.config.ts + __tests__/ directory |
| 4 | Frontend optimizations (image, ISR, dynamic imports, enrichment) | PR 4 | `cd frontend && npx next build` | Next.js build verification | Component rewrites + api.ts + new utility |

## Phase 1: Backend Quick Wins

- [x] 1.1 Create `backend/src/modules/categories/__tests__/categories.service.spec.ts` — unit tests for findAll happy path and findOne error path
- [x] 1.2 Create `backend/src/modules/categories/__tests__/categories.controller.spec.ts` — controller delegation tests
- [x] 1.3 Create `backend/src/modules/favorites/__tests__/favorites.service.spec.ts` — unit tests for findByUser happy path
- [x] 1.4 Create `backend/src/modules/favorites/__tests__/favorites.controller.spec.ts` — controller returns user favorites
- [x] 1.5 Create `backend/src/modules/dollar-rate/__tests__/dollar-rate.service.spec.ts` — unit tests for cached value and connection failure
- [x] 1.6 Create `backend/src/modules/dollar-rate/__tests__/dollar-rate.controller.spec.ts` — unauthenticated request rejection test
- [x] 1.7 Create `backend/src/modules/supabase/__tests__/supabase.service.spec.ts` — connection failure handling test
- [x] 1.8 Create `backend/src/auth/__tests__/jwt-auth.guard.spec.ts` — valid token allow, expired token reject
- [x] 1.9 Create `backend/src/auth/__tests__/roles.guard.spec.ts` — required role check test
- [x] 1.10 Create `backend/src/auth/__tests__/get-current-user.decorator.spec.ts` — extracts user from request
- [x] 1.11 Create `backend/src/auth/__tests__/login.dto.spec.ts` — rejects missing email
- [x] 1.12 Create `backend/src/orders/__tests__/create-order.dto.spec.ts` — rejects negative quantity
- [x] 1.13 Create `backend/src/health/health.controller.ts` — GET /health returns status, timestamp, database connectivity
- [x] 1.14 Create `backend/src/common/cache.service.ts` — in-memory Map with configurable TTL, get/set/delete methods
- [x] 1.15 Replace `console.error` calls in `backend/src/auth/auth.service.ts` with NestJS `Logger`
- [x] 1.16 Add `compression` middleware to `backend/src/main.ts` behind `ENABLE_COMPRESSION` env flag

**Verification**: `cd backend && npx jest --coverage` — all new tests pass, coverage ≥ 80% for tested modules

## Phase 2: Backend Integration

- [x] 2.1 Create `backend/test/jest-e2e.json` — Supertest configuration with TestingModule setup
- [x] 2.2 Create `backend/test/app.e2e-spec.ts` — TestingModule boots, Supabase client mocked
- [x] 2.3 Create `backend/test/auth.e2e-spec.ts` — registration returns JWT, login valid/invalid, protected route rejects unauthenticated
- [x] 2.4 Create `backend/test/cart.e2e-spec.ts` — add/update/remove items, enrichment returns product details
- [x] 2.5 Create `backend/test/orders.e2e-spec.ts` — create order from cart, reject empty cart
- [x] 2.6 Create `backend/test/products.e2e-spec.ts` — paginated list, filter by category
- [x] 2.7 Add `@nestjs/throttler` rate limiting to `backend/src/main.ts` behind `ENABLE_RATE_LIMIT` env flag (100 req/min default)
- [x] 2.8 Batch cart enrichment in `backend/src/cart/cart.service.ts` — single Supabase query instead of N per-item queries
- [x] 2.9 Create `backend/test/rate-limit.e2e-spec.ts` — request within limit succeeds, exceeding limit returns 429

**Verification**: `cd backend && npx jest --config test/jest-e2e.json` — all e2e tests pass

## Phase 3: Frontend Test Setup

- [x] 3.1 Install vitest, @testing-library/react, @testing-library/jest-dom, jsdom in `frontend/`
- [x] 3.2 Create `frontend/vitest.config.ts` — jsdom environment, path aliases matching tsconfig, setup file
- [x] 3.3 Create `frontend/src/test-setup.ts` — import jest-dom matchers, custom render with providers
- [x] 3.4 Create `frontend/src/__tests__/api.test.ts` — auth header attachment, non-OK response throw, network failure handling
- [x] 3.5 Create `frontend/src/__tests__/contexts/cart-context.test.tsx` — add item, update quantity, remove item
- [x] 3.6 Create `frontend/src/__tests__/contexts/auth-context.test.tsx` — stores token on login, clears on logout
- [x] 3.7 Create `frontend/src/__tests__/utils/currency.test.ts` — formatter handles valid input and zero
- [x] 3.8 Create `frontend/src/__tests__/components/product-card.test.tsx` — renders with next/image (after Phase 4 migration, placeholder test)
- [x] 3.9 Create `frontend/src/__tests__/components/cart-item.test.tsx` — renders quantity and price correctly

**Verification**: `cd frontend && npx vitest run` — all tests pass, ≥ 10 passing tests

## Phase 4: Frontend Optimization

- [x] 4.1 Create `frontend/src/lib/enrichment.ts` — shared cart enrichment utility: single fetch, deduplication, graceful missing-product handling
- [x] 4.2 Migrate `frontend/src/components/product-card.tsx` — replace raw `<img>` with `next/image`, add `sizes` prop and WebP format
- [x] 4.3 Migrate category images in `frontend/src/app/categories/` pages — replace `<img>` with `next/image` (N/A — no categories directory exists)
- [x] 4.4 Add ISR to `frontend/src/app/products/page.tsx` — `export const revalidate = 300` for product listing
- [x] 4.5 Add SWR to `frontend/src/lib/api.ts` — `useSWR` wrapper for client-side product/category fetching with stale-while-revalidate
- [x] 4.6 Dynamic-import checkout page in `frontend/src/app/checkout/page.tsx` — `next/dynamic` with loading skeleton
- [x] 4.7 Dynamic-import order history in `frontend/src/app/orders/page.tsx` — `next/dynamic` with loading skeleton
- [x] 4.8 Refactor cart contexts to use `frontend/src/lib/enrichment.ts` — eliminate duplicated fetch logic
- [x] 4.9 Update `frontend/src/__tests__/components/product-card.test.tsx` — verify next/image rendering with correct props

**Verification**: `cd frontend && npx next build` — build succeeds with no errors, all images use next/image
