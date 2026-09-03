# Frontend Test Setup Specification

## Purpose

Define the test infrastructure and initial test suite for the Next.js frontend. The system SHALL provide a working Vitest + React Testing Library configuration with mocks for Supabase and tests for core utilities, contexts, and components.

## Requirements

### Requirement: Vitest Configuration

The system SHALL configure Vitest as the test runner for the frontend project. The configuration SHALL support TypeScript, JSX/TSX transforms, path aliases matching `tsconfig.json`, and a jsdom environment for DOM testing.

#### Scenario: Vitest runs successfully

- GIVEN the frontend test configuration exists
- WHEN `npm run test` is executed in the `frontend/` directory
- THEN Vitest SHALL discover and run all `*.test.ts` and `*.test.tsx` files
- AND the exit code SHALL be 0 if all tests pass

#### Scenario: Path aliases resolve correctly

- GIVEN a test imports from `@/components/ui/button`
- WHEN the test runs under Vitest
- THEN the import SHALL resolve to the correct source file

### Requirement: Testing Library Setup

The system SHALL install and configure `@testing-library/react`, `@testing-library/jest-dom`, and `@testing-library/user-event`. A shared test utility file SHALL provide custom render, common assertions, and reusable mocks.

#### Scenario: Custom render wraps component in providers

- GIVEN a test uses the custom `render` utility
- WHEN a component requiring RouterContext is rendered
- THEN the component SHALL be wrapped with necessary providers
- AND queries like `getByText` SHALL work against the rendered output

#### Scenario: Jest-dom matchers are available

- GIVEN a test file imports `@testing-library/jest-dom`
- WHEN assertions like `toBeInTheDocument()` are used
- THEN the matchers SHALL be recognized without manual type augmentation

### Requirement: Supabase Client Mocking

The system SHALL provide a mock factory for the Supabase client. The mock SHALL support chaining methods (`from().select().eq()`) and configurable return values per test.

#### Scenario: Mock Supabase returns test data

- GIVEN a test configures the Supabase mock to return `[{ id: 1, name: 'Test' }]`
- WHEN a component calls `supabase.from('products').select()`
- THEN the mock SHALL return the configured data
- AND no real HTTP request SHALL be made

#### Scenario: Mock Supabase simulates error

- GIVEN a test configures the Supabase mock to return an error
- WHEN a component calls the Supabase client
- THEN the error SHALL be propagated to the component's error handling

### Requirement: Api Client Unit Tests

The system SHALL provide unit tests for `src/lib/api.ts`. Tests SHALL verify fetch wrapper behavior, error handling, authentication header injection, and response parsing.

#### Scenario: Api client attaches auth header

- GIVEN a valid JWT token is stored in the auth context
- WHEN `apiGet('/products')` is called
- THEN the fetch request SHALL include `Authorization: Bearer {token}` header

#### Scenario: Api client throws on non-OK response

- GIVEN the server returns HTTP 500
- WHEN `apiGet('/products')` is called
- THEN the function SHALL throw an error with the status code

#### Scenario: Api client handles network failure

- GIVEN the network is unavailable
- WHEN `apiGet('/products')` is called
- THEN the function SHALL throw a descriptive network error

### Requirement: Context Unit Tests

The system SHALL provide unit tests for CartContext and AuthContext. Tests SHALL verify state management, action dispatching, and side effects.

#### Scenario: CartContext adds item to cart

- GIVEN CartContext is provided via the test wrapper
- WHEN `addToCart({ productId: 1, quantity: 2 })` is called
- THEN the cart state SHALL contain one item with quantity 2
- AND `localStorage` SHALL be updated

#### Scenario: AuthContext stores token on login

- GIVEN AuthContext is provided via the test wrapper
- WHEN `login(email, password)` is called with valid credentials
- THEN the token SHALL be stored in state
- AND `localStorage` SHALL be updated with the token

#### Scenario: AuthContext clears state on logout

- GIVEN a user is logged in with a valid token
- WHEN `logout()` is called
- THEN the token SHALL be removed from state
- AND `localStorage` SHALL be cleared

### Requirement: Utility Function Tests

The system SHALL provide unit tests for shared utility functions (formatting, validation, cart enrichment helpers). Each utility SHALL have at least one happy path and one edge case test.

#### Scenario: Currency formatter handles valid input

- GIVEN the formatCurrency utility
- WHEN called with `1234.5`
- THEN it SHALL return a formatted currency string (e.g., `$1,234.50`)

#### Scenario: Currency formatter handles zero

- GIVEN the formatCurrency utility
- WHEN called with `0`
- THEN it SHALL return `$0.00`

#### Scenario: Cart enrichment utility deduplicates products

- GIVEN the enrichment utility receives duplicate product IDs
- WHEN enrichment is performed
- THEN each product SHALL appear only once in the result
