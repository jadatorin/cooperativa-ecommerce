# Payment Report User Specification

## Purpose

Provide authenticated users with a view of their own payment history, including filtering by date range, payment method, and payment status, with the ability to export results as CSV or trigger a browser print for PDF.

## Requirements

### Requirement: User Payment Endpoint

The system SHALL provide a `GET /payments/user` endpoint that returns paginated payment data for the authenticated user. Results include order details with payment fields.

#### Scenario: Authenticated user fetches payment history

- GIVEN an authenticated user with id `user-123`
- WHEN `GET /payments/user?page=1&limit=10` is called
- THEN the response returns up to 10 orders belonging to `user-123`
- AND each order includes `id`, `order_number`, `total`, `subtotal`, `tax`, `payment_method`, `payment_status`, `paid_at`, `status`, `created_at`
- AND pagination metadata is included (`page`, `limit`, `total`, `totalPages`)

#### Scenario: User cannot access other users' payments

- GIVEN an authenticated user with id `user-123`
- WHEN a query attempts to fetch payments for `user-456`
- THEN the endpoint returns only orders where `user_id = user-123`
- AND no data from `user-456` is exposed

### Requirement: User Payment Filters

The system SHALL support query parameters for filtering: `date_from` (ISO date), `date_to` (ISO date), `payment_method` (text), and `payment_status` (text).

#### Scenario: Filter by date range

- GIVEN user `user-123` has orders from January to June
- WHEN `GET /payments/user?date_from=2026-03-01&date_to=2026-05-31` is called
- THEN only orders with `created_at` between March 1 and May 31 are returned

#### Scenario: Filter by payment method

- GIVEN user `user-123` has orders with methods 'cash', 'transfer', 'card'
- WHEN `GET /payments/user?payment_method=cash` is called
- THEN only orders with `payment_method = 'cash'` are returned

#### Scenario: Filter by payment status

- GIVEN user `user-123` has orders with statuses 'pending', 'paid'
- WHEN `GET /payments/user?payment_status=paid` is called
- THEN only orders with `payment_status = 'paid'` are returned

#### Scenario: Combined filters

- GIVEN user `user-123` has diverse payment data
- WHEN `GET /payments/user?date_from=2026-01-01&payment_method=cash&payment_status=paid` is called
- THEN only orders matching all three criteria are returned

### Requirement: User Payment Summary Totals

The system SHALL return summary totals alongside the paginated results: `total_amount` (sum of `total` for filtered results), `total_paid` (sum where `payment_status = 'paid'`), and `total_pending` (sum where `payment_status = 'pending'`).

#### Scenario: Summary reflects filtered results

- GIVEN user `user-123` has 5 orders totaling $500
- WHEN filters reduce results to 3 orders totaling $300
- THEN `total_amount` = 300, not 500

#### Scenario: Summary with no matching orders

- GIVEN user `user-123` has no orders matching a filter
- WHEN the filtered query returns empty results
- THEN `total_amount`, `total_paid`, and `total_pending` are all 0

### Requirement: User CSV Export

The system SHALL provide a `GET /payments/user/export?format=csv` endpoint that downloads the filtered payment data as a CSV file.

#### Scenario: CSV export of filtered data

- GIVEN user `user-123` applies filters `date_from=2026-01-01&payment_status=paid`
- WHEN `GET /payments/user/export?format=csv&date_from=2026-01-01&payment_status=paid` is called
- THEN a CSV file is downloaded with columns: Order Number, Date, Total, Subtotal, Tax, Payment Method, Payment Status, Paid At, Status
- AND the CSV contains only filtered results (up to 1000 rows)

#### Scenario: CSV export with no results

- GIVEN user `user-123` applies a filter with no matching orders
- WHEN the export endpoint is called
- THEN a CSV file is downloaded with headers only and no data rows

### Requirement: User PDF Export

The system SHALL support PDF export via browser print. The frontend SHALL render a print-optimized view of the payment report when the user clicks "Export PDF".

#### Scenario: PDF export triggers browser print

- GIVEN user `user-123` is on the payment report page
- WHEN the user clicks "Export PDF"
- THEN `window.print()` is called
- AND the print layout shows a formatted report with payment data, date range, and summary totals

### Requirement: User Payment Report Page

The system SHALL provide a `/dashboard/payments` page accessible to authenticated users with a table displaying payment data, filter controls, and export buttons.

#### Scenario: Page loads with payment data

- GIVEN an authenticated user navigates to `/dashboard/payments`
- WHEN the page loads
- THEN the payment table displays the user's orders with payment columns
- AND pagination controls are visible
- AND filter dropdowns for payment method and status are present
- AND date range picker is present

#### Scenario: Page shows empty state

- GIVEN an authenticated user with no orders
- WHEN the page loads
- THEN a message indicates no payment records found
- AND a link to browse products is shown

## Non-Functional Requirements

- **Security**: Endpoint MUST enforce `user_id` filtering via Supabase RLS or explicit WHERE clause
- **Performance**: Response time under 500ms for up to 10,000 user orders
- **Export limit**: CSV export limited to 1000 rows to prevent abuse
- **Pagination**: Default page size is 10, maximum is 50
