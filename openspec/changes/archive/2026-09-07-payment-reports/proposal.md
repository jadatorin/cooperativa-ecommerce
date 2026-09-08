# Proposal: Payment Reports

## Intent

The cooperative needs visibility into payment data for financial reconciliation and reporting. Currently, orders lack payment-specific fields (method, status, timestamps), making it impossible to generate payment reports, filter by payment method, or export financial data. This blocks monthly reconciliation and audit workflows.

## Scope

### In Scope
- **DB**: Add payment columns to orders table (payment_method, payment_status, paid_at, subtotal, tax)
- **Backend**: User payment report endpoint (own orders) + Admin payment report endpoint (all orders, with filters)
- **Frontend**: Payment report page with date range, payment method/status filters, CSV/PDF export
- **Extend**: OrdersService and AdminService (not new modules)

### Out of Scope
- Payment gateway integration (Stripe, MercadoPago) — separate initiative
- Real-time payment webhooks
- Accounting system integration
- Refund or chargeback workflows
- Multi-currency support

## Capabilities

### New Capabilities
- `payment-report-user`: User-facing endpoint and UI to view own payment history with filters and export
- `payment-report-admin`: Admin-facing endpoint and UI to view all payments with advanced filters, summaries, and export
- `payment-data-model`: Database schema extension for payment-specific fields on orders

### Modified Capabilities
- `orders`: Orders table schema extended with payment columns; existing queries remain backward-compatible

## Approach

1. **DB Migration**: Add `payment_method` (text, nullable), `payment_status` (text, default 'pending'), `paid_at` (timestamptz, nullable), `subtotal` (numeric), `tax` (numeric) to orders table. Backfill existing orders with defaults.
2. **Backend**: Extend `OrdersService` with `getUserPayments(userId, filters)` and `AdminService` with `getPaymentReport(filters)`. Both return paginated results with summary totals. Leverage existing Supabase query patterns.
3. **Frontend**: Create `/dashboard/payments` and `/admin/payments` pages. Reuse table patterns from OrdersTable. Add date picker, dropdown filters, and export buttons. Export uses client-side CSV generation + browser print for PDF (consistent with ReceiptPrint approach).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/modules/orders/orders.service.ts` | Modified | Add `getUserPayments()` method |
| `backend/src/modules/admin/admin.service.ts` | Modified | Add `getPaymentReport()` method |
| `frontend/src/app/dashboard/payments/page.tsx` | New | User payment report page |
| `frontend/src/app/admin/payments/page.tsx` | New | Admin payment report page |
| Supabase `orders` table | Modified | Add 5 payment columns |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Backfill migration may be slow on large datasets | Low | Use batched updates; orders table is small in cooperative context |
| Existing order queries may break if columns are NOT NULL | Low | All new columns are nullable with sensible defaults |
| Export performance on large result sets | Medium | Paginate backend responses; client-side export limited to current page or filtered set |

## Rollback Plan

- **DB**: Drop added columns (data loss acceptable — payment data is additive, not modifying existing rows)
- **Backend**: Remove new service methods; existing endpoints unaffected
- **Frontend**: Delete new page routes; no state persistence involved

## Dependencies

- Supabase migration access
- Existing `OrdersService` and `AdminService` patterns
- shadcn/ui components (Table, Button, DatePicker, Select)

## Success Criteria

- [ ] Orders table has payment_method, payment_status, paid_at, subtotal, tax columns
- [ ] `GET /payments/user` returns paginated payment data for authenticated user
- [ ] `GET /payments/admin` returns paginated payment data with filters for admin
- [ ] `/dashboard/payments` page renders payment table with filters
- [ ] `/admin/payments` page renders payment table with admin-level filters
- [ ] CSV export downloads filtered payment data
- [ ] PDF export triggers browser print with formatted report
