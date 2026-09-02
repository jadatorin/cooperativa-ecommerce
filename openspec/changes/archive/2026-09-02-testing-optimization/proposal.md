# Proposal: Testing & Optimization

## Intent

The cooperativa-ecommerce project has critical testing gaps and performance issues that threaten production reliability:

- **Backend**: 8 unit tests across 4 modules, zero E2E/integration tests, untested guards/strategy/decorators
- **Frontend**: Zero test infrastructure, zero tests
- **Performance**: N+1 queries in auth and cart, no caching, no compression, no rate limiting, no health checks

These gaps make deployments risky and hurt user experience (slow responses, no fault tolerance).

## Scope

### In Scope
- Backend unit tests for missing modules (categories, favorites, dollar-rate, supabase)
- Backend guard/strategy/decorator/DTO unit tests
- Backend E2E/integration tests with Supertest
- Frontend test infrastructure (Vitest + testing-library)
- Frontend unit tests for api.ts, contexts, utils
- Backend optimizations (JWT caching, cart batching, compression, rate limiting, health check, Logger)
- Frontend optimizations (next/image consistency, ISR/SWR, dynamic imports)

### Out of Scope
- Database schema changes or migrations
- New features or UI redesign
- CI/CD pipeline changes (future work)
- Accessibility audits
- Load testing or stress testing infrastructure

## Capabilities

### New Capabilities
- `backend-unit-tests`: Unit tests for categories, favorites, dollar-rate, supabase services/controllers + guards, strategy, decorators, DTOs
- `backend-integration-tests`: E2E tests using Supertest covering auth flows, cart operations, order creation, and protected routes
- `frontend-test-setup`: Vitest + React testing-library + jsdom configuration, test utilities, and mocks for Supabase
- `backend-optimization`: JWT user caching (Map/in-memory), cart enrichment batching (Promise.all), gzip compression, rate limiting, health endpoint, Logger migration
- `frontend-optimization`: next/image migration across all pages, ISR/SWR for product/category data, dynamic imports for heavy components, shared cart enrichment utility

### Modified Capabilities
None — this change adds testing and optimization without altering existing spec-level behavior.

## Approach

**Phase 1 — Backend Quick Wins (1-2 days)**
- Add unit tests for 4 missing modules (categories, favorites, dollar-rate, supabase)
- Add health check endpoint (`GET /health`)
- Replace `console.error` with NestJS `Logger` in auth.service.ts
- Add response compression (`compression` middleware)
- Add in-memory cache for dollar rate and categories

**Phase 2 — Backend Integration (2-3 days)**
- Write E2E tests with Supertest for auth, cart, orders, products
- Test guard/strategy/decorator behavior
- Add rate limiting middleware
- Batch cart enrichment (single query instead of N)

**Phase 3 — Frontend Test Setup (1-2 days)**
- Install and configure Vitest + React testing-library
- Write tests for `api.ts` (mock fetch), contexts (CartContext, AuthContext), utils
- Test key components (product-card, cart-item)

**Phase 4 — Frontend Optimization (2-3 days)**
- Migrate all raw `<img>` to `next/image` with proper sizing
- Add ISR/SWR for product listings and categories
- Dynamic imports for checkout and order-history pages
- Extract shared cart enrichment utility to eliminate duplication

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/modules/categories/` | Modified | Add `.spec.ts` files for service and controller |
| `backend/src/modules/favorites/` | Modified | Add `.spec.ts` files for service and controller |
| `backend/src/modules/dollar-rate/` | Modified | Add `.spec.ts` files for service and controller |
| `backend/src/modules/supabase/` | Modified | Add `.spec.ts` for service |
| `backend/src/auth/` | Modified | Add guard/strategy/decorator specs, Logger migration, JWT cache |
| `backend/src/cart/` | Modified | Add enrichment batching logic |
| `backend/src/main.ts` | Modified | Add compression, rate limiting, health check route |
| `frontend/src/lib/api.ts` | Modified | Add ISR/SWR caching options |
| `frontend/src/contexts/` | Modified | Test files for CartContext, AuthContext |
| `frontend/src/components/` | Modified | Migrate img → next/image, add dynamic imports |
| `frontend/vitest.config.ts` | New | Test configuration |
| `frontend/src/__tests__/` | New | Test directory for utils, contexts, api |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| JWT caching serves stale user data | Low | Cache TTL 5 min, invalidate on logout |
| Cart batching breaks existing behavior | Medium | Write integration tests BEFORE refactoring |
| Compression increases memory on Render | Low | Render supports gzip natively; test in staging |
| Rate limiting blocks legitimate traffic | Medium | Conservative defaults (100 req/min), configurable |
| next/image migration causes layout shift | Low | Preserve exact dimensions, test each page |

## Rollback Plan

1. **Git revert**: All changes are additive (new test files, new middleware). `git revert <commit>` removes them cleanly.
2. **Feature flags**: Compression, rate limiting, and caching can be disabled via env vars (`ENABLE_COMPRESSION=false`, `ENABLE_RATE_LIMIT=false`, `ENABLE_CACHE=false`).
3. **Cache invalidation**: If stale data occurs, restart backend to clear in-memory cache. No persistent state to clean.
4. **Rollback priority**: If issues arise, disable cache → disable rate limiting → disable compression → revert code.

## Dependencies

- `@nestjs/throttler` (rate limiting)
- `compression` + `@types/compression` (response compression)
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` (frontend tests)
- `supertest` + `@types/supertest` (already in devDependencies, verify version)

## Success Criteria

- [ ] Backend test coverage ≥ 80% for all 8 modules
- [ ] Frontend has working Vitest setup with ≥ 10 passing tests
- [ ] E2E tests cover auth flow, cart operations, and order creation
- [ ] Health check returns 200 with database status
- [ ] Response compression reduces payload size ≥ 30% for JSON responses
- [ ] Cart page load time < 500ms (down from N+1 latency)
- [ ] Dollar rate and categories cached for 5 minutes minimum
- [ ] Zero `console.error` calls in production code (all replaced with Logger)
