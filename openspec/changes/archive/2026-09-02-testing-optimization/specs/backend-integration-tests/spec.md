# Backend Integration Tests Specification

## Purpose

Define integration and end-to-end test requirements for the backend API using Supertest. The system SHALL verify complete request flows through NestJS middleware, guards, controllers, and services against a real or mocked Supabase instance.

## Requirements

### Requirement: Test Infrastructure

The system SHALL configure a NestJS TestingModule for integration tests. The TestingModule SHALL override Supabase client dependencies with test doubles that simulate database responses. Tests SHALL use Supertest to send HTTP requests and assert responses.

#### Scenario: TestingModule boots successfully

- GIVEN the integration test suite is started
- WHEN the NestJS TestingModule is compiled
- THEN the application context SHALL be created without errors
- AND Supertest SHALL be able to send requests to the application

#### Scenario: Supabase client is mocked

- GIVEN a test overrides the Supabase client provider
- WHEN a controller method calls the Supabase client
- THEN the mocked client SHALL return the predefined test data

### Requirement: Auth Flow Integration Tests

The system SHALL provide integration tests covering the complete authentication flow: registration, login, JWT generation, and protected route access.

#### Scenario: Registration creates user and returns JWT

- GIVEN a POST request to `/auth/register` with valid credentials
- WHEN the request is processed
- THEN the response SHALL have status 201
- AND the response body SHALL contain an `access_token` field
- AND the user SHALL exist in the database (or mocked store)

#### Scenario: Login returns JWT for valid credentials

- GIVEN a registered user with email `test@example.com` and password `secure123`
- WHEN a POST request to `/auth/login` is sent with those credentials
- THEN the response SHALL have status 200
- AND the response body SHALL contain a valid JWT `access_token`

#### Scenario: Login rejects invalid password

- GIVEN a registered user with email `test@example.com`
- WHEN a POST request to `/auth/login` is sent with wrong password
- THEN the response SHALL have status 401
- AND the response body SHALL contain an error message

#### Scenario: Protected route rejects unauthenticated request

- GIVEN no Authorization header is provided
- WHEN a GET request to `/cart` is sent
- THEN the response SHALL have status 401

### Requirement: Cart Operations Integration Tests

The system SHALL provide integration tests covering cart CRUD operations including add, update quantity, remove items, and calculate totals.

#### Scenario: Add item to cart

- GIVEN an authenticated user with an empty cart
- WHEN a POST request to `/cart` is sent with `{ productId, quantity: 2 }`
- THEN the response SHALL have status 201
- AND the cart SHALL contain one item with quantity 2

#### Scenario: Update cart item quantity

- GIVEN an authenticated user with a cart containing product P1 with quantity 1
- WHEN a PATCH request to `/cart/:itemId` is sent with `{ quantity: 5 }`
- THEN the response SHALL have status 200
- AND the item quantity SHALL be updated to 5

#### Scenario: Remove item from cart

- GIVEN an authenticated user with a cart containing product P1
- WHEN a DELETE request to `/cart/:itemId` is sent
- THEN the response SHALL have status 200
- AND the item SHALL no longer be in the cart

#### Scenario: Cart enrichment returns product details

- GIVEN an authenticated user with a cart containing product ID 42
- WHEN a GET request to `/cart` is sent
- THEN the response SHALL include product name, price, and image URL
- AND the enrichment SHALL use a single batched query, not N individual queries

### Requirement: Order Creation Integration Tests

The system SHALL provide integration tests covering order creation, validation, and status management.

#### Scenario: Create order from cart

- GIVEN an authenticated user with a non-empty cart
- WHEN a POST request to `/orders` is sent
- THEN the response SHALL have status 201
- AND an order SHALL be created with status `pending`
- AND the cart SHALL be cleared

#### Scenario: Reject order from empty cart

- GIVEN an authenticated user with an empty cart
- WHEN a POST request to `/orders` is sent
- THEN the response SHALL have status 400
- AND the response body SHALL indicate the cart is empty

### Requirement: Products and Categories Integration Tests

The system SHALL provide integration tests for read-only endpoints that verify data retrieval and filtering.

#### Scenario: Get all products returns paginated list

- GIVEN the database contains 25 products
- WHEN a GET request to `/products?page=1&limit=10` is sent
- THEN the response SHALL have status 200
- AND the response SHALL contain 10 products
- AND the response SHALL include total count metadata

#### Scenario: Get products by category filters correctly

- GIVEN the database contains products in categories "electronics" and "food"
- WHEN a GET request to `/products?category=electronics` is sent
- THEN the response SHALL contain only products in the "electronics" category

### Requirement: Protected Route Guards Integration

The system SHALL verify that JWT guards and role-based guards work correctly at the integration level, not just in isolation.

#### Scenario: Admin route rejects regular user

- GIVEN an authenticated user with role `user`
- WHEN a DELETE request to `/admin/products/:id` is sent
- THEN the response SHALL have status 403
