import { test as base, expect } from '@playwright/test';

type TestFixtures = {
  adminLogin: void;
};

export const test = base.extend<TestFixtures>({
  adminLogin: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@coop.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await use();
  },
});

export { expect } from '@playwright/test';