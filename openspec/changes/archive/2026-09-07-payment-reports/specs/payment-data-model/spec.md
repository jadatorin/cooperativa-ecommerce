# Payment Data Model Specification

## Purpose

Extend the `app_orders` table with payment-specific columns to support payment reporting, reconciliation, and export workflows. All new columns are nullable with sensible defaults to maintain backward compatibility with existing orders.

## Requirements

### Requirement: Payment Columns Extension

The system SHALL add five payment-related columns to the `app_orders` table: `payment_method` (text, nullable), `payment_status` (text, default 'pending'), `paid_at` (timestamptz, nullable), `subtotal` (numeric, not null), and `tax` (numeric, not null).

#### Scenario: Migration adds payment columns to existing orders

- GIVEN the `app_orders` table exists with existing orders
- WHEN the migration runs
- THEN `payment_method` is added as nullable text
- AND `payment_status` is added as text with default 'pending'
- AND `paid_at` is added as nullable timestamptz
- AND `subtotal` is added as numeric with default 0
- AND `tax` is added as numeric with default 0

#### Scenario: Backfill populates defaults for existing orders

- GIVEN existing orders have no payment data
- WHEN the migration backfill runs
- THEN `subtotal` is set to the order's `total` value
- AND `tax` is set to 0
- AND `payment_status` remains 'pending'
- AND `payment_method` remains NULL
- AND `paid_at` remains NULL

#### Scenario: New orders accept payment fields

- GIVEN a new order is created via the API
- WHEN the order is inserted into `app_orders`
- THEN `payment_method`, `payment_status`, `paid_at`, `subtotal`, and `tax` are stored with provided values
- AND NULL values for `payment_method` and `paid_at` are accepted

### Requirement: Payment Status Enumeration

The system SHALL constrain `payment_status` to valid values: 'pending', 'paid', 'partial', 'refunded', 'failed'.

#### Scenario: Valid payment status accepted

- GIVEN an order with payment_status = 'paid'
- WHEN the status is updated via API
- THEN the update succeeds

#### Scenario: Invalid payment status rejected

- GIVEN an order with payment_status = 'pending'
- WHEN an update attempts to set payment_status = 'invalid_status'
- THEN the database rejects the update with a constraint violation error

### Requirement: Subtotal and Tax Calculation Invariants

The system SHALL ensure `subtotal + tax` equals the order `total` for consistency. The `subtotal` field represents the sum of order item subtotals; `tax` represents the applied tax amount.

#### Scenario: Subtotal and tax sum to total

- GIVEN an order with subtotal = 80.00 and tax = 8.00
- WHEN the order is created or updated
- THEN the order total SHALL equal 88.00 (subtotal + tax)

#### Scenario: Zero tax order

- GIVEN an order with subtotal = 50.00 and tax = 0
- WHEN the order is created
- THEN the order total SHALL equal 50.00

### Requirement: Backward Compatibility

The system SHALL NOT modify existing order queries or break existing endpoints. All new columns are nullable or have defaults, ensuring existing `SELECT *` queries return additional fields without errors.

#### Scenario: Existing findAll query returns payment fields

- GIVEN the `app_orders` table has payment columns
- WHEN `OrdersService.findAll()` executes `select('*')`
- THEN the response includes `payment_method`, `payment_status`, `paid_at`, `subtotal`, and `tax`
- AND existing fields (`id`, `total`, `status`, etc.) remain unchanged

#### Scenario: Existing order creation works without payment fields

- GIVEN a client creates an order via `POST /orders` without payment fields
- WHEN the order is inserted
- THEN `payment_status` defaults to 'pending'
- AND `subtotal` and `tax` default to 0
- AND `payment_method` and `paid_at` default to NULL

### Requirement: Index on Payment Status

The system SHALL add an index on `app_orders(payment_status)` to optimize filtering and reporting queries.

#### Scenario: Payment status filter query uses index

- GIVEN the `app_orders` table has an index on `payment_status`
- WHEN a query filters by `payment_status = 'paid'`
- THEN the query planner uses the index for efficient filtering

## Non-Functional Requirements

- **Performance**: Migration backfill MUST complete in under 5 seconds for up to 10,000 existing orders
- **Storage**: New columns add approximately 50 bytes per row; index adds approximately 10% overhead on the `payment_status` column
- **Rollback**: All added columns can be dropped without data loss on existing columns
