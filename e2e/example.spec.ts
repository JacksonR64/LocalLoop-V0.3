import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('body')).toBeVisible();
});

test('page is responsive', async ({ page }) => {
  await page.goto('/');

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('body')).toBeVisible();

  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('body')).toBeVisible();
});
