# Tasks: Payment Reports

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800-1100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | DB migration + backend endpoints | PR 1 | `npm run test:unit` (backend) | Manual: Supabase SQL editor + curl | `add_payment_columns.sql`, `orders.service.ts`, `orders.controller.ts`, `admin.service.ts`, `admin.controller.ts` |
| 2 | Frontend shared components + user page | PR 2 | `npm run build` (frontend) | Manual: `/dashboard/payments` with filters | `PaymentTable.tsx`, `PaymentFilterBar.tsx`, `ExportButtons.tsx`, `export-csv.ts`, `dashboard/payments/page.tsx` |
| 3 | Admin page + summary + nav links | PR 3 | `npm run build` (frontend) | Manual: `/admin/payments` with summary + nav | `PaymentSummaryCard.tsx`, `admin/payments/page.tsx`, nav modifications |

---

## Phase 1: Database Migration

- [x] 1.1 Create `backend/database/add_payment_columns.sql` with ALTER TABLE adding 5 nullable columns (payment_method TEXT DEFAULT 'cash', payment_status TEXT DEFAULT 'pending', paid_at TIMESTAMPTZ, subtotal DECIMAL(10,2) DEFAULT 0, tax DECIMAL(10,2) DEFAULT 0), CHECK constraint on payment_status, backfill UPDATE, and 3 indexes
- [x] 1.2 Add `idx_orders_payment_method`, `idx_orders_payment_status`, `idx_orders_paid_at` indexes (already in 1.1, verify the file includes all three)

## Phase 2: Backend DTOs

- [x] 2.1 Create `backend/src/modules/orders/dto/payment-report.dto.ts` with PaymentReportDto class (startDate, endDate, paymentMethod, paymentStatus, page, limit) using class-validator decorators
- [x] 2.2 Create `backend/src/modules/admin/dto/payment-report.dto.ts` with AdminPaymentReportDto extending PaymentReportDto, adding optional userId field

## Phase 3: Backend Services

- [x] 3.1 Add `getUserPayments(userId, filters: PaymentReportDto)` method to `backend/src/modules/orders/orders.service.ts` — queries app_orders with user_id filter, payment filters (AND), pagination, and returns { payments, pagination }
- [x] 3.2 Add `getPaymentReport(filters: AdminPaymentReportDto)` method to `backend/src/modules/admin/admin.service.ts` — queries all orders with admin filters, calculates summary (totalRevenue, totalTax, totalSubtotal, byMethod, byStatus), returns { payments, summary, pagination }

## Phase 4: Backend Controllers

- [x] 4.1 Add `GET /orders/payments/user` endpoint to `backend/src/modules/orders/orders.controller.ts` — uses JwtAuthGuard, applies PaymentReportDto validation, calls `getUserPayments(req.user.id, filters)`
- [x] 4.2 Add `GET /admin/payments` endpoint to `backend/src/modules/admin/admin.controller.ts` — uses JwtAuthGuard + RolesGuard (admin), applies AdminPaymentReportDto, calls `getPaymentReport(filters)`

## Phase 5: Frontend Types + API Client

- [x] 5.1 Add `PaymentRecord`, `PaymentSummary`, `PaymentReportResponse`, `AdminPaymentReportResponse` interfaces to `frontend/src/types/admin.ts`
- [x] 5.2 Add `fetchUserPayments(token, params)` and `fetchAdminPayments(token, params)` functions to `frontend/src/lib/api.ts`

## Phase 6: Frontend Shared Components

- [x] 6.1 Create `frontend/src/lib/export-csv.ts` with `generateCSV(data, columns)` utility — builds CSV string, creates Blob, triggers download via URL.createObjectURL
- [x] 6.2 Create `frontend/src/components/admin/PaymentFilterBar.tsx` — date range pickers, payment method select, payment status select, clear button; reads/writes URL searchParams
- [x] 6.3 Create `frontend/src/components/admin/PaymentTable.tsx` — renders payment data in Table component with columns: Order #, Date, Total, Subtotal, Tax, Payment Method (badge), Payment Status (colored badge: paid=green, pending=yellow, failed=red, refunded=orange), Paid At
- [x] 6.4 Create `frontend/src/components/admin/ExportButtons.tsx` — CSV button calls generateCSV; PDF button calls window.print() with print-optimized layout

## Phase 7: Frontend User Payment Page

- [x] 7.1 Create `frontend/src/app/dashboard/payments/page.tsx` — page component using useFetchWithRetry, PaymentFilterBar, PaymentTable, ExportButtons, PaginationControls; empty state for no results; summary showing total_amount, total_paid, total_pending

## Phase 8: Frontend Admin Payment Page

- [x] 8.1 Create `frontend/src/components/admin/PaymentSummaryCard.tsx` — displays summary stats: total orders, total amount, paid count/amount, pending count/amount, breakdown by method
- [x] 8.2 Create `frontend/src/app/admin/payments/page.tsx` — page component with PaymentSummaryCard, PaymentFilterBar (extra: userId, search), PaymentTable, ExportButtons, PaginationControls; URL preset support via searchParams

## Phase 9: Navigation Integration

- [x] 9.1 Add "Payments" navigation link to dashboard sidebar/layout pointing to `/dashboard/payments`
- [x] 9.2 Add "Payments" navigation link to admin sidebar/layout pointing to `/admin/payments`

## Phase 10: Testing

- [x] 10.1 Write unit test for PaymentReportDto validation — valid/invalid filter combinations, required vs optional fields
- [x] 10.2 Write unit test for generateCSV utility — correct column headers, data formatting, download trigger
- [x] 10.3 Write integration test for `getUserPayments()` — filter by date, method, status; verify pagination math
- [x] 10.4 Write integration test for `getPaymentReport()` — verify summary totals match payment records; verify byMethod/byStatus aggregation
- [ ] 10.5 Verify E2E: `/dashboard/payments` renders table, filters work, CSV download triggers, PDF print opens
- [ ] 10.6 Verify E2E: `/admin/payments` renders summary + table, admin-only access (403 for non-admin), filters + export work

---

## Key Learnings
1. All new database columns are nullable with defaults — existing queries remain unaffected without migration risk.
2. Backend follows existing controller/service DTO pattern — no new NestJS modules needed, just new methods on existing services.
3. Frontend reuses PaginationControls and Table components from existing admin infrastructure — no new component library additions.
4. Client-side CSV + browser print export follows the existing ReceiptPrint pattern — no server-side PDF dependency.
5. URL searchParams for filter state enables shareable links and browser history navigation without extra state management.
