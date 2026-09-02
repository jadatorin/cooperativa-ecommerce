# Backend Unit Tests Specification

## Purpose

Define unit test coverage requirements for backend modules that currently lack tests: categories, favorites, dollar-rate, supabase, and shared concerns (guards, strategy, decorators, DTOs). The system SHALL achieve ≥80% unit test coverage across all 8 modules.

## Requirements

### Requirement: Module Service Unit Tests

The system SHALL provide unit tests for every service method in categories, favorites, dollar-rate, and supabase modules. Each test SHALL mock the Supabase client and verify correct query construction, return values, and error handling.

#### Scenario: Categories service findAll returns data

- GIVEN the Supabase client returns a list of categories
- WHEN `CategoriesService.findAll()` is called
- THEN the method SHALL return the array of category objects
- AND the Supabase client SHALL have been called with the correct table name

#### Scenario: Categories service findOne throws on missing

- GIVEN the Supabase client returns an empty result for a given ID
- WHEN `CategoriesService.findOne(id)` is called
- THEN the method SHALL throw a NotFoundException

#### Scenario: Dollar-rate service returns cached value

- GIVEN a dollar rate was previously fetched and cached
- WHEN `DollarRateService.getRate()` is called within the TTL window
- THEN the Supabase client SHALL NOT be queried again
- AND the cached value SHALL be returned

#### Scenario: Supabase service handles connection failure

- GIVEN the Supabase client throws a network error
- WHEN any service method calls the Supabase client
- THEN the error SHALL be caught and re-thrown as an appropriate exception

### Requirement: Module Controller Unit Tests

The system SHALL provide unit tests for every controller endpoint in categories, favorites, and dollar-rate modules. Tests SHALL verify HTTP status codes, response shapes, and that the controller delegates to the correct service method.

#### Scenario: Favorites controller returns user favorites

- GIVEN the FavoritesService returns a list of favorites for a user
- WHEN `GET /favorites` is called with a valid user
- THEN the controller SHALL return a 200 status with the favorites array

#### Scenario: Dollar-rate controller rejects unauthenticated requests

- GIVEN no JWT token is provided
- WHEN `GET /dollar-rate` is called
- THEN the controller SHALL return a 401 status

### Requirement: Guard and Strategy Unit Tests

The system SHALL provide unit tests for all guards (JwtAuthGuard, RolesGuard) and the JwtStrategy. Tests SHALL verify token validation, user extraction, and role-based access decisions.

#### Scenario: JwtAuthGuard allows valid token

- GIVEN a valid JWT token is attached to the request
- WHEN JwtAuthGuard evaluates the request
- THEN the guard SHALL call `canActivate` and return true
- AND the user object SHALL be attached to the request

#### Scenario: JwtAuthGuard rejects expired token

- GIVEN an expired JWT token is attached to the request
- WHEN JwtAuthGuard evaluates the request
- THEN the guard SHALL throw an UnauthorizedException

#### Scenario: RolesGuard checks required role

- GIVEN a user with role `user` (not `admin`)
- WHEN RolesGuard evaluates a route requiring `admin` role
- THEN the guard SHALL throw a ForbiddenException

### Requirement: Decorator Unit Tests

The system SHALL provide unit tests for custom decorators (GetCurrentUser, Roles). Tests SHALL verify that decorators correctly extract data from the execution context.

#### Scenario: GetCurrentUser extracts user from request

- GIVEN a request object containing `{ user: { id: '123' } }`
- WHEN `@GetCurrentUser()` decorator is invoked
- THEN it SHALL return the user object `{ id: '123' }`

### Requirement: DTO Validation Tests

The system SHALL provide unit tests for all DTOs with class-validator decorators. Tests SHALL verify that valid data passes validation and invalid data is rejected.

#### Scenario: LoginDto rejects missing email

- GIVEN a LoginDto with no email field
- WHEN the DTO is validated using class-validator
- THEN validation SHALL fail with an `IsNotEmpty` error

#### Scenario: CreateOrderDto rejects negative quantity

- GIVEN a CreateOrderDto with quantity `-1`
- WHEN the DTO is validated using class-validator
- THEN validation SHALL fail with a `Min` error

### Requirement: Test Isolation

All unit tests SHALL be isolated — each test MUST NOT depend on external services, databases, or other tests. All external dependencies SHALL be mocked using Jest mocks.

#### Scenario: Tests run independently

- GIVEN the test suite for categories module
- WHEN any single test is run in isolation
- THEN it SHALL pass without requiring other tests to run first
- AND no file system or network calls SHALL be made
