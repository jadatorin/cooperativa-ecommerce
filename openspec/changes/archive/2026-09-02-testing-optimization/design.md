# Design: Testing & Optimization

## Technical Approach

Incremental, phase-isolated improvements following existing NestJS and Next.js patterns. Backend: unit tests for missing modules, integration tests with Supertest, performance middleware (compression, rate limiting, caching). Frontend: Vitest + testing-library setup, component tests, next/image migration, ISR/SWR, dynamic imports. All changes are additive with feature-flag fallbacks.

## Architecture Decisions

### Decision: Test Framework for Frontend

**Choice**: Vitest + React Testing Library  
**Alternatives considered**: Jest (default with Next.js), Cypress (E2E only)  
**Rationale**: Vitest is faster with Next.js 16, shares Vite config, and supports ESM. React Testing Library is the standard for component testing.

### Decision: Backend Integration Test Approach

**Choice**: Supertest with NestJS TestingModule (real DB mocked)  
**Alternatives considered**: Full E2E with real Supabase (requires cloud), Cypress  
**Rationale**: Follows existing NestJS patterns, fast execution, deterministic. Mock Supabase at service level.

### Decision: Caching Strategy for Backend

**Choice**: In-memory Map with TTL (5 min)  
**Alternatives considered**: Redis (external), Supabase caching, no caching  
**Rationale**: Simple, no external dependencies, sufficient for single-instance deployment. TTL prevents stale data.

### Decision: Frontend Data Fetching Optimization

**Choice**: SWR for client-side, ISR for static pages  
**Alternatives considered**: React Query, no caching  
**Rationale**: SWR integrates with Next.js, minimal config. ISR for product/category pages reduces server load.

### Decision: Rate Limiting Implementation

**Choice**: `@nestjs/throttler` with in-memory store  
**Alternatives considered**: Express-rate-limit, Redis-based  
**Rationale**: NestJS-native, consistent with framework patterns, sufficient for single-instance.

## Data Flow

```
Request → Compression → Rate Limiter → JWT Guard → Controller → Service → Supabase
                                         ↓ (cache hit)
                                       Cache → Response
```

Frontend: `fetchAPI()` → SWR/ISR → Component → next/image

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/modules/categories/__tests__/*.spec.ts` | Create | Unit tests for categories service/controller |
| `backend/src/modules/favorites/__tests__/*.spec.ts` | Create | Unit tests for favorites service/controller |
| `backend/src/modules/dollar-rate/__tests__/*.spec.ts` | Create | Unit tests for dollar-rate service/controller |
| `backend/src/modules/supabase/__tests__/*.spec.ts` | Create | Unit tests for supabase service |
| `backend/src/auth/__tests__/*.spec.ts` | Create | Unit tests for guards, strategy, decorators |
| `backend/test/jest-e2e.json` | Modify | Add integration test configuration |
| `backend/test/*.e2e-spec.ts` | Create | E2E tests for auth, cart, orders |
| `backend/src/main.ts` | Modify | Add compression, rate limiting, health check |
| `backend/src/health/health.controller.ts` | Create | Health check endpoint |
| `backend/src/common/cache.service.ts` | Create | Generic in-memory cache with TTL |
| `frontend/vitest.config.ts` | Create | Vitest configuration |
| `frontend/src/__tests__/api.test.ts` | Create | Unit tests for api.ts |
| `frontend/src/__tests__/contexts/*.test.tsx` | Create | Unit tests for CartContext, AuthContext |
| `frontend/src/__tests__/utils/*.test.ts` | Create | Unit tests for utility functions |
| `frontend/src/components/product-card.tsx` | Modify | Migrate img → next/image |
| `frontend/src/app/products/page.tsx` | Modify | Add ISR/SWR |
| `frontend/src/app/checkout/page.tsx` | Modify | Dynamic import |

## Interfaces / Contracts

```typescript
// Backend cache service interface
interface CacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
}

// Health check response
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

// Frontend SWR options
interface UseApiOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Services, controllers, guards, DTOs | Mock dependencies, test isolated behavior |
| Integration | API flows, auth, cart, orders | Supertest + TestingModule, mock Supabase |
| Component | React components, contexts | React Testing Library, mock API calls |
| E2E | Full user flows | Not in scope (future) |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

**Phase 1**: Backend unit tests + health endpoint (no risk)  
**Phase 2**: Backend integration tests + compression (feature-flagged)  
**Phase 3**: Frontend test setup (no risk)  
**Phase 4**: Frontend optimizations (next/image, ISR, dynamic imports)

Feature flags: `ENABLE_COMPRESSION`, `ENABLE_RATE_LIMIT`, `ENABLE_CACHE`  
Rollback: revert commits or disable via env vars.

## Open Questions

- [ ] Should we add E2E tests with real Supabase for critical paths?
- [ ] What is the exact TTL for JWT cache (5 min vs 10 min)?
- [ ] Should we implement cache invalidation on data mutations?
- [ ] Do we need to add monitoring for cache hit rates?
