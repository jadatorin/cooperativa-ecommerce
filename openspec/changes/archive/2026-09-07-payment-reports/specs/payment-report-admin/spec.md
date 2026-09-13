# Payment Report Admin Specification

## Purpose

Provide admin users with a comprehensive payment dashboard showing all orders with payment data, advanced filtering, summary statistics, and export capabilities for financial reconciliation and audit workflows.

## Requirements

### Requirement: Admin Payment Endpoint

The system SHALL provide a `GET /payments/admin` endpoint that returns paginated payment data for all orders. Endpoint MUST require admin role authentication.

#### Scenario: Admin fetches all payment records

- GIVEN an authenticated admin user
- WHEN `GET /payments/admin?page=1&limit=20` is called
- THEN the response returns up to 20 orders with payment fields
- AND each order includes `id`, `order_number`, `user_id`, `total`, `subtotal`, `tax`, `payment_method`, `payment_status`, `paid_at`, `status`, `created_at`
- AND pagination metadata is included

#### Scenario: Non-admin user is rejected

- GIVEN an authenticated user with role 'customer'
- WHEN `GET /payments/admin` is called
- THEN the endpoint returns 403 Forbidden

### Requirement: Admin Payment Filters

The system SHALL support query parameters: `date_from`, `date_to`, `payment_method`, `payment_status`, `order_status`, and `search` (order number or user email).

#### Scenario: Filter by payment status

- GIVEN the database has 100 orders, 40 with payment_status = 'paid'
- WHEN `GET /payments/admin?payment_status=paid` is called
- THEN only the 40 paid orders are returned

#### Scenario: Filter by order status

- GIVEN the database has orders with various statuses
- WHEN `GET /payments/admin?order_status=delivered` is called
- THEN only orders with `status = 'delivered'` are returned

#### Scenario: Search by order number

- GIVEN order #1042 exists
- WHEN `GET /payments/admin?search=1042` is called
- THEN order #1042 is returned

#### Scenario: Search by user email

- GIVEN user with email 'user@test.com' has orders
- WHEN `GET /payments/admin?search=user@test.com` is called
- THEN all orders belonging to that user are returned

#### Scenario: Combined filters with date range

- GIVEN admin applies date_from, payment_status, and order_status filters
- WHEN the endpoint is called with all three parameters
- THEN only orders matching all criteria are returned

### Requirement: Admin Payment Summary Statistics

The system SHALL return summary statistics alongside paginated results: `total_orders` (count), `total_amount` (sum of total), `total_subtotal` (sum of subtotal), `total_tax` (sum of tax), `paid_count`, `paid_amount`, `pending_count`, `pending_amount`.

#### Scenario: Summary reflects filtered results

- GIVEN 100 total orders, 60 paid, 40 pending
- WHEN filter reduces to 30 paid orders totaling $3,000
- THEN `total_orders` = 30, `total_amount` = 3000, `paid_count` = 30, `pending_count` = 0

#### Scenario: Summary with no matching orders

- GIVEN admin applies a filter with no results
- WHEN the endpoint is called
- THEN all summary fields are 0

### Requirement: Admin CSV Export

The system SHALL provide a `GET /payments/admin/export?format=csv` endpoint that downloads filtered payment data as CSV.

#### Scenario: CSV export with all filters applied

- GIVEN admin applies date range, payment method, and status filters
- WHEN `GET /payments/admin/export?format=csv` is called with the same filters
- THEN a CSV file is downloaded with columns: Order Number, User Email, Date, Total, Subtotal, Tax, Payment Method, Payment Status, Paid At, Order Status
- AND the CSV contains only filtered results (up to 5000 rows)

#### Scenario: CSV export without filters exports all data

- GIVEN admin requests export without filters
- WHEN the export endpoint is called
- THEN all payment records are exported (up to 5000 rows)

### Requirement: Admin PDF Export

The system SHALL support PDF export via browser print for admin payment reports.

#### Scenario: Admin PDF export

- GIVEN admin is on the payment report page with filters applied
- WHEN admin clicks "Export PDF"
- THEN `window.print()` is called
- AND the print layout shows the payment report with filters, summary statistics, and data table

### Requirement: Admin Payment Report Page

The system SHALL provide a `/admin/payments` page accessible to admin users with a data table, filter controls, summary cards, and export buttons.

#### Scenario: Page loads with payment data and statistics

- GIVEN an authenticated admin navigates to `/admin/payments`
- WHEN the page loads
- THEN summary cards display total orders, total amount, paid amount, and pending amount
- AND the payment table displays all orders with payment columns
- AND filter controls for date range, payment method, payment status, and order status are visible

#### Scenario: Page loads with filter presets from URL

- GIVEN admin navigates to `/admin/payments?payment_status=paid`
- WHEN the page loads
- THEN the payment status filter is pre-selected to 'paid'
- AND only paid orders are displayed in the table

#### Scenario: Page shows empty state for no results

- GIVEN admin applies filters that match no orders
- WHEN the page renders
- THEN the table shows "No payment records found"
- AND summary cards show 0 values

#### Scenario: Pagination works with filters

- GIVEN admin has filtered results spanning 5 pages
- WHEN admin clicks "Next page"
- THEN page 2 of filtered results is displayed
- AND summary statistics remain the same (based on all filtered results, not just current page)

### Requirement: Admin OrdersTable Extension

The system SHALL extend the existing `OrdersTable` component pattern to include payment columns. The admin payment table SHALL display: Order Number, Date, Total, Subtotal, Tax, Payment Method, Payment Status, Paid At, Order Status.

#### Scenario: Table renders payment columns

- GIVEN the admin payment table is loaded
- WHEN orders are displayed
- THEN each row shows payment_method as a badge, payment_status as a colored badge, and paid_at as a formatted date

#### Scenario: Payment status badges use distinct colors

- GIVEN orders with different payment statuses
- WHEN the table renders
- THEN 'paid' status shows green badge
- AND 'pending' status shows yellow badge
- AND 'failed' status shows red badge
- AND 'refunded' status shows orange badge

## Non-Functional Requirements

- **Security**: Endpoint MUST require admin role; RLS policies MUST allow admin access to all orders
- **Performance**: Response time under 1000ms for up to 100,000 orders
- **Export limit**: CSV export limited to 5000 rows
- **Pagination**: Default page size is 20, maximum is 100
- **Search**: Full-text search on order_number and user email MUST use indexed columns
