# Backend Optimization Specification

## Purpose

Define performance optimization requirements for the NestJS backend. The system SHALL address N+1 query patterns, add response compression, rate limiting, a health check endpoint, and replace console.error with NestJS Logger.

## Requirements

### Requirement: JWT User Caching

The system SHALL cache JWT-decoded user data in memory using a Map with a 5-minute TTL. Subsequent requests with the same user ID SHALL retrieve data from cache instead of querying Supabase. Cache SHALL be invalidated on logout or after TTL expiration.

#### Scenario: First request queries Supabase

- GIVEN a user makes their first request after server start
- WHEN the JWT guard decodes the token
- THEN the user data SHALL be fetched from Supabase
- AND the result SHALL be stored in the in-memory cache

#### Scenario: Second request uses cache

- GIVEN a user's data is already cached
- WHEN another request arrives within 5 minutes
- THEN the Supabase client SHALL NOT be queried
- AND the cached user data SHALL be returned

#### Scenario: Cache expires after TTL

- GIVEN a user's data was cached 6 minutes ago
- WHEN a new request arrives
- THEN the cache entry SHALL be treated as stale
- AND Supabase SHALL be queried again
- AND the fresh result SHALL replace the cache entry

#### Scenario: Logout invalidates cache

- GIVEN a user's data is cached
- WHEN the user logs out
- THEN the cache entry for that user SHALL be removed

### Requirement: Cart Enrichment Batching

The system SHALL batch cart enrichment queries into a single database call. Instead of N individual queries (one per cart item), the system SHALL fetch all product details in a single query using `IN` clause or equivalent.

#### Scenario: Enrichment uses single query

- GIVEN a cart contains 5 items with product IDs [1, 2, 3, 4, 5]
- WHEN cart enrichment is triggered
- THEN the Supabase client SHALL receive exactly one query for product data
- AND the result SHALL contain all 5 products

#### Scenario: Enrichment handles empty cart

- GIVEN a cart contains 0 items
- WHEN cart enrichment is triggered
- THEN no Supabase query SHALL be executed
- AND an empty array SHALL be returned

#### Scenario: Enrichment handles missing products

- GIVEN a cart contains product IDs [1, 999] where 999 does not exist
- WHEN cart enrichment is triggered
- THEN the result SHALL contain only the existing product (ID 1)
- AND missing products SHALL be excluded (not throw)

### Requirement: Response Compression

The system SHALL enable gzip response compression for all HTTP responses. Compression SHALL be applied via NestJS middleware (`compression` package). The system SHALL set the `Content-Encoding: gzip` header on compressed responses.

#### Scenario: JSON response is compressed

- GIVEN the compression middleware is active
- WHEN a client sends `Accept-Encoding: gzip`
- THEN the response body SHALL be gzip-compressed
- AND the `Content-Encoding` header SHALL be `gzip`

#### Scenario: Small responses are not compressed

- GIVEN the compression threshold is set to 1KB
- WHEN a response body is 500 bytes
- THEN the response SHALL NOT be compressed
- AND the `Content-Encoding` header SHALL be absent

#### Scenario: Compression is disabled via env var

- GIVEN `ENABLE_COMPRESSION=false` is set in the environment
- WHEN the server starts
- THEN compression middleware SHALL NOT be registered
- AND all responses SHALL be uncompressed

### Requirement: Rate Limiting

The system SHALL implement request rate limiting using `@nestjs/throttler`. The default limit SHALL be 100 requests per minute per IP. Rate limiting SHALL be configurable via environment variables (`RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`).

#### Scenario: Request within limit succeeds

- GIVEN the rate limit is 100 requests/minute
- WHEN a client sends 50 requests in one minute
- THEN all requests SHALL return with their normal status codes

#### Scenario: Request exceeding limit is rejected

- GIVEN the rate limit is 100 requests/minute
- WHEN a client sends 101 requests in one minute
- THEN the 101st request SHALL return status 429
- AND the response SHALL include a `Retry-After` header

#### Scenario: Rate limiting is disabled via env var

- GIVEN `ENABLE_RATE_LIMIT=false` is set in the environment
- WHEN the server starts
- THEN no rate limiting middleware SHALL be applied
- AND unlimited requests SHALL be allowed

### Requirement: Health Check Endpoint

The system SHALL expose a `GET /health` endpoint that returns application status and database connectivity. The endpoint SHALL return status 200 when healthy and 503 when unhealthy.

#### Scenario: Health check returns healthy status

- GIVEN the Supabase database is reachable
- WHEN `GET /health` is called
- THEN the response SHALL have status 200
- AND the body SHALL contain `{ status: "ok", database: "connected" }`

#### Scenario: Health check returns unhealthy status

- GIVEN the Supabase database is unreachable
- WHEN `GET /health` is called
- THEN the response SHALL have status 503
- AND the body SHALL contain `{ status: "error", database: "disconnected" }`

### Requirement: Logger Migration

The system SHALL replace all `console.error` and `console.log` calls in production code with NestJS `Logger`. All log messages SHALL include appropriate context (module name).

#### Scenario: Auth service uses Logger

- GIVEN the auth service encounters an error during login
- WHEN the error is caught
- THEN it SHALL call `Logger.error()` with context `'AuthService'`
- AND no `console.error` call SHALL exist in the file

#### Scenario: No console calls in production code

- GIVEN the codebase is scanned for `console.error` and `console.log`
- WHEN the scan completes
- THEN zero occurrences SHALL be found in `backend/src/` (excluding test files)
