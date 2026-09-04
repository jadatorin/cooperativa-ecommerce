# Cooperativa 5 de Julio — Mandatory Development Practices

> **Every developer and AI agent working on this project MUST follow these practices.**
> These are not suggestions — they are requirements for all code changes.

---

## 🔒 Security

### Input Validation
- **ALL** POST/PUT endpoints must use DTOs with `class-validator` decorators
- Use `@IsIn()` for enum fields, `@IsString()`, `@IsNumber()`, etc.
- Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` is active

```typescript
// ✅ CORRECT
export class UpdateUserRoleDto {
  @IsIn(['user', 'admin'])
  role: string;
}

// ❌ WRONG — no validation
async updateUserRole(@Body() body: { role: string }) { ... }
```

### Authentication & Authorization
- Import guards from `common/guards/`, NOT from `auth/guards/`
- Use `@Roles(Role.ADMIN)` decorator on admin endpoints
- Always use `JwtAuthGuard` + `RolesGuard` together

```typescript
// ✅ CORRECT
import { RolesGuard } from '../../common/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Put('users/:id')
async updateUserRole() { ... }
```

### Self-Protection
- Prevent users from changing their own role (self-demotion)
- Check `req.user.id !== userId` before mutations

### Database Constraints
- Frontend status options MUST match DB CHECK constraints
- Verify enum values before sending to backend

---

## ⚡ Performance

### Database Queries
- **NEVER** use `SELECT *` — specify only needed columns
- Use `Promise.all` for independent queries
- Use SQL aggregation (`SUM`, `COUNT`) instead of JS reduce

```typescript
// ✅ CORRECT — parallel + selective columns
const [usersResult, ordersResult] = await Promise.all([
  supabase.from('app_users').select('id, email, full_name, role'),
  supabase.from('app_orders').select('id, total, status'),
]);

// ❌ WRONG — sequential + SELECT *
const users = await supabase.from('app_users').select('*');
const orders = await supabase.from('app_orders').select('*');
```

### Revenue/Aggregation
- Use Supabase RPC functions for complex aggregations
- Create SQL functions in `backend/database/` directory
- Never fetch all rows into memory for JS calculation

### Frontend Fetching
- Always use `AbortController` for cleanup
- Wrap fetches in `useEffect` with proper cleanup
- Use `Promise.allSettended` when partial failures are acceptable

```typescript
// ✅ CORRECT — with cleanup
useEffect(() => {
  const controller = new AbortController();
  
  async function loadData() {
    const data = await fetchAdminDashboard(token);
    if (!controller.signal.aborted) {
      setStats(data);
    }
  }
  
  loadData();
  return () => controller.abort();
}, [token]);
```

---

## 🏗️ Architecture

### Component Size
- Keep components under 200 lines
- Extract sub-components when a file grows beyond 200 lines
- One component per file

### File Structure
```
frontend/src/app/admin/
  page.tsx              (~150 lines: auth guard, layout, state coordination)
  dashboard-stats.tsx   (~80 lines: stat cards)
  users-table.tsx       (~120 lines: table + role mutation)
  orders-table.tsx      (~120 lines: table + status mutation)

frontend/src/components/admin/
  DashboardStatsCard.tsx
  UsersTable.tsx
  OrdersTable.tsx
  PaginationControls.tsx

frontend/src/types/
  admin.ts              (shared admin types)
```

### State Management
- Keep state in parent component
- Pass state + callbacks as props to children
- Use `useCallback` for functions passed to children
- Memoize expensive computations with `useMemo`

### Type Safety
- **NEVER** use `any[]` — always type response data
- Create shared types in `types/` directory
- Import types, don't redefine them

```typescript
// ✅ CORRECT
import { AdminUser, AdminOrder } from '@/types/admin';

export async function fetchAdminUsers(token: string): Promise<{
  users: AdminUser[];
  pagination: Pagination;
}> { ... }

// ❌ WRONG
export async function fetchAdminUsers(token: string): Promise<{
  users: any[];
  pagination: any;
}> { ... }
```

---

## 🎨 UX Standards

### Loading States
- Show loading indicator for EVERY async operation
- Use skeleton loaders for content areas
- Never show empty content during load

### Error States
- Show error message with retry button
- Display specific error details (not just " algo salió mal")
- Allow users to retry failed operations

### Empty States
- Show meaningful message when lists are empty
- Never show empty tables without explanation

### Dialogs & Modals
- Use `AlertDialog` for destructive actions (role changes, deletions)
- **Wait for async handler to complete before closing dialog**
- Show pending state during mutation

```typescript
// ✅ CORRECT — async close
<AlertDialogAction onClick={async (e) => {
  await handleUpdateRole();  // Wait for completion
  onOpenChange(false);       // Then close
}}>
  Actualizar
</AlertDialogAction>

// ❌ WRONG — immediate close
<AlertDialogAction onClick={(e) => {
  handleUpdateRole();        // Fire and forget
  onOpenChange(false);       // Closes immediately
}}>
  Actualizar
</AlertDialogAction>
```

### Feedback
- Show toast notification after successful mutations
- Use `aria-live="polite"` on toast containers
- Provide visual feedback for all user actions

### Accessibility
- Use `<TableHead>` (`<th>`) for table headers, not `<TableCell>` (`<td>`)
- Add `aria-label` to action buttons
- Support keyboard navigation (Escape to close dialogs)

---

## 🧪 Testing Requirements

### Backend Tests
- Create `__tests__/*.spec.ts` for every module
- Test all service methods: happy path, errors, edge cases
- Mock Supabase client properly (chain pattern)
- Test guard behavior (authorized vs unauthorized)

### Frontend Tests
- Test API functions with mocked fetch
- Test components with `@testing-library/react`
- Mock `useAuth`, `useRouter`, API functions
- Test loading, error, empty, and success states

### Test Commands
```bash
# Backend — run admin tests
cd backend; npx jest --testPathPattern="admin" --verbose

# Frontend — run admin tests
cd frontend; npx vitest run src/__tests__/api.test.ts src/__tests__/admin/ --reporter=verbose

# TypeScript check
cd backend; npx tsc --noEmit
cd frontend; npx tsc --noEmit
```

### Coverage Expectations
- All new endpoints must have unit tests
- All new API functions must have tests
- All new components must have component tests

---

## 📁 File Naming Conventions

### Backend
- Modules: `kebab-case.module.ts`
- Controllers: `kebab-case.controller.ts`
- Services: `kebab-case.service.ts`
- DTOs: `update-xxx.dto.ts` or `create-xxx.dto.ts`
- Tests: `kebab-case.service.spec.ts`

### Frontend
- Components: `PascalCase.tsx` (e.g., `UsersTable.tsx`)
- Pages: `page.tsx` (Next.js convention)
- Types: `kebab-case.ts` (e.g., `admin.ts`)
- Tests: `kebab-case.test.tsx` or `kebab-case.test.ts`

---

## 🔧 Git & Commits

### Commit Messages
Use conventional commits:
```
feat: add admin dashboard with user management
fix: correct status values in order updates
perf: parallel dashboard queries with Promise.all
test: add unit tests for admin service
refactor: extract components from admin page
```

### PR Guidelines
- Keep PRs focused (one feature or fix per PR)
- Include test coverage for new code
- Verify TypeScript compiles without errors
- Run relevant test suites before pushing

---

## 🚨 Common Mistakes to Avoid

1. **Using `SELECT *`** — always specify columns
2. **Using `any[]`** — always type responses
3. **Sequential queries** — use `Promise.all` for independent queries
4. **Immediate dialog close** — wait for async handler
5. **Missing loading states** — always show feedback during async
6. **Missing error handling** — always catch and display errors
7. **Missing tests** — every new feature needs tests
8. **Wrong guard import** — use `common/guards/`, not `auth/guards/`
9. **Self-demotion** — prevent users from changing their own role
10. **Status mismatch** — frontend values must match DB constraints

---

## 📚 Quick Reference

### Key Files
- `backend/src/modules/admin/` — Admin module (controller, service, DTOs)
- `frontend/src/app/admin/page.tsx` — Admin dashboard page
- `frontend/src/components/admin/` — Extracted admin components
- `frontend/src/types/admin.ts` — Shared admin types
- `frontend/src/lib/api.ts` — API functions

### Key Commands
```bash
# Start backend
cd backend; npm run start:dev

# Start frontend
cd frontend; npm run dev

# Run all backend tests
cd backend; npm test

# Run all frontend tests
cd frontend; npm test

# Build for production
cd frontend; npm run build
```

---

*Last updated: September 2026*
*Maintained by: Cooperativa 5 de Julio Development Team*
