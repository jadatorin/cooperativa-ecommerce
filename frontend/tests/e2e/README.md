# E2E Testing with Playwright

## Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   npx playwright install
   ```

2. Run tests:
   ```bash
   npm run test:e2e           # Run all tests headless
   npm run test:e2e:ui        # Run with Playwright UI
   npm run test:e2e:report    # View HTML report
   ```

## Test Structure

- `helpers.ts` - Auth utilities (loginAsAdmin, loginAsCustomer)
- `fixtures.ts` - Playwright test fixtures for common setup
- `login-admin.spec.ts` - Login flow and admin link visibility
- `admin-dashboard.spec.ts` - Admin dashboard page states
- `admin-print.spec.ts` - Print flow and receipt modal
- `mobile-header.spec.ts` - Mobile header collapse
- `role-based-nav.spec.ts` - Role-based navigation visibility

## Environment Requirements

- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:3001`
- Test user: `test@coop.com` / `Password123!` (admin role)

## Adding New Tests

1. Create a new file in `tests/e2e/`
2. Import helpers from `./helpers`
3. Use `loginAsAdmin(page)` for authenticated tests
4. Follow the naming convention: `feature-name.spec.ts`

## Debugging

- Use `npm run test:e2e:ui` for interactive debugging
- Check screenshots in `test-results/` on failure
- Review traces in `playwright-report/`

## CI/CD

Tests run automatically on push to `master`:
- Chromium, Firefox, WebKit
- Mobile Chrome (Pixel 5)
- Screenshots on failure
- HTML report generation