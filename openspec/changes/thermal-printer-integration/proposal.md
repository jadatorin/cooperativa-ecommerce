# Proposal: Thermal Receipt Printer Integration

## Intent

Enable thermal receipt printing from the admin dashboard for completed orders. The admin needs to print customer receipts directly from the order management interface, replacing manual handwritten summaries. This addresses the operational need for fast, accurate transaction records at point of fulfillment.

## Scope

### In Scope
- **PR1**: Backend — Extend order query to include items (product names, quantities, unit prices, taxes)
- **PR2**: Frontend — Create `ReceiptPrint.tsx` component with 80mm HTML template and "Print" button in OrdersTable
- **PR3**: API — Add `fetchOrderDetail(token, orderId)` function in api.ts to retrieve full order data including items

### Out of Scope
- Native thermal printer bridging (USB/Serial) — browser limitations; will use `window.print()` only
- Server-side printer drivers or print spooler integration
- Point-of-sale hardware setup beyond receipt template
- Inventory or order status workflow changes
- New database tables or migrations

## Capabilities

### New Capabilities
- `receipt-print`: Frontend component that renders an 80mm-wide HTML template for thermal printer output, with a Print button on each order row in the admin table. Uses `window.print()` on mount.
- `order-detail-fetch`: API function to retrieve complete order data including items, tax, subtotal, payment method, seller info, and shop address for receipt generation.

### Modified Capabilities
- `getOrders`: Will be extended to include item summaries (kept backward-compatible; new fields optional)

## Approach

Option A (selected — lowest risk, fastest path):

1. **PR1**: Modify `getOrders()` or add `getOrderDetails(orderId)` in the backend to include items data (product names, quantities, unit prices) in the order list response. Estimated ~20 lines changed.

2. **PR2**: Create `ReceiptPrint.tsx` in the frontend `components/admin/` directory. HTML template fixed at 80ch width (CSS px units render correctly in browsers for thermal paper simulation). On mount, calls `window.print()`. Includes a "Print" button per order in OrdersTable. Estimated ~80 lines.

3. **PR3**: Add `fetchOrderDetail(token, orderId)` in `frontend/src/lib/api.ts` that calls a new backend endpoint or extends the existing order fetch to return full item data. Estimated ~20 lines.

All three PRs are independently revertable. No DB migrations. No API breaking changes — new fields are additive.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/modules/admin/admin.service.ts` | Modified | Extend order query to include items (product names, quantities, prices) |
| `frontend/src/lib/api.ts` | Modified | Add `fetchOrderDetail(token, orderId)` function |
| `frontend/src/app/admin/OrdersTable.tsx` | Modified | Add "Print" button per order row |
| `frontend/src/components/admin/ReceiptPrint.tsx` | New | 80mm HTML template component with print trigger |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Browser `window.print()` opens default printer dialog — user may select wrong printer | Low | Document that this works for local network thermal printers; future native bridging can be added separately |
| Items data may be incomplete for older orders | Low | Backend query returns whatever items exist; empty state handled gracefully in template |
| 80mm width rendering varies across browsers | Medium | Use `ch` units (character width) rather than `px` or `in`; test in Chrome/Edge |

## Rollback Plan

- **PR1**: Revert the order query changes — remove item columns from SQL SELECT, revert `getOrders()` to original column list.
- **PR2**: Delete `ReceiptPrint.tsx` and remove the "Print" button from OrdersTable. No state persistence involved.
- **PR3**: Remove `fetchOrderDetail()` from api.ts. No breaking changes since it's a new function.

## Dependencies

- Backend: NestJS service method returning item data alongside order summary
- Frontend: Next.js App Router, shadcn/ui, Tailwind v4
- API: Existing `fetchAPI` utility in `frontend/src/lib/api.ts`

## Success Criteria

- [ ] Backend order query returns items (product name, quantity, unit price) for at least one order
- [ ] `ReceiptPrint.tsx` renders without errors and includes a functional Print button
- [ ] `fetchOrderDetail(token, orderId)` returns complete order data including items, tax, subtotal, payment method
- [ ] Admin dashboard OrdersTable displays "Print" button on each order row
- [ ] Clicking Print triggers browser print dialog with 80mm-optimized template

## Next Step

Ready for specs (sdd-spec) or design (sdd-design).