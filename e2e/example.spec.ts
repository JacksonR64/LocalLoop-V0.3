import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  // Wait for page to load properly
  await page.waitForLoadState('domcontentloaded');

  // Check that the basic page structure is present using data-test-id
  await expect(page.locator('[data-test-id="homepage-header"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();
  await expect(page.locator('[data-test-id="main-content"]')).toBeVisible();

  // Check that LocalLoop branding is visible
  await expect(page.locator('[data-test-id="homepage-title"]')).toBeVisible();
  await expect(page.locator('[data-test-id="homepage-title"]')).toHaveText('LocalLoop');

  // Check hero section content
  await expect(page.locator('[data-test-id="hero-title"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-title"]')).toHaveText('Discover Local Events');

  await expect(page.locator('[data-test-id="hero-description"]')).toBeVisible();

  // Check navigation elements (viewport-aware)
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  if (isMobile) {
    // On mobile, desktop nav should be hidden and mobile menu button visible
    await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeHidden();
  } else {
    // On desktop, desktop nav should be visible
    await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeVisible();
    await expect(page.locator('[data-test-id="browse-events-button"]')).toBeVisible();
    await expect(page.locator('[data-test-id="create-event-link"]')).toBeVisible();
  }

  // Check footer (always visible)
  await expect(page.locator('[data-test-id="homepage-footer"]')).toBeVisible();
  await expect(page.locator('[data-test-id="footer-title"]')).toHaveText('LocalLoop');

  console.log('Homepage loaded successfully with all data-test-id elements');
});

test('page is responsive', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Wait for essential elements to be ready
  await expect(page.locator('[data-test-id="homepage-header"]')).toBeVisible();

  // Test mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500); // Allow layout to settle

  // Check that mobile menu button is visible on mobile
  await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();

  // Check that desktop nav is hidden on mobile
  await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeHidden();

  // Check that main content still exists
  await expect(page.locator('[data-test-id="main-content"]')).toBeVisible();
  await expect(page.locator('[data-test-id="hero-section"]')).toBeVisible();

  // Verify no horizontal overflow by checking body width
  const bodyBox = await page.locator('body').boundingBox();
  if (bodyBox) {
    expect(bodyBox.width).toBeLessThanOrEqual(375);
  }

  // Test desktop viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(500); // Allow layout to settle

  // Check that desktop navigation is visible
  await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeVisible();

  // Mobile menu button should be hidden on desktop (display: none)
  const mobileMenuButton = page.locator('[data-test-id="mobile-menu-button"]');
  await expect(mobileMenuButton).toBeHidden();

  // Check that main content is still visible in both viewports
  await expect(page.locator('[data-test-id="hero-title"]')).toBeVisible();
  await expect(page.locator('[data-test-id="upcoming-events-section"]')).toBeVisible();

  console.log('Page responsive tests passed with data-test-id selectors');
});

test('navigation interactions work', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Check viewport and test appropriate navigation
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 768;

  if (isMobile) {
    // Test mobile navigation
    await expect(page.locator('[data-test-id="mobile-menu-button"]')).toBeVisible();

    // Click mobile menu button to open menu
    await page.locator('[data-test-id="mobile-menu-button"]').click();
    await page.waitForTimeout(500);

    // Check that mobile navigation is now visible
    await expect(page.locator('[data-test-id="mobile-navigation"]')).toBeVisible();
    await expect(page.locator('[data-test-id="mobile-browse-events-button"]')).toBeVisible();
  } else {
    // Test desktop navigation
    await expect(page.locator('[data-test-id="desktop-navigation"]')).toBeVisible();

    // Test Browse Events button
    const browseEventsBtn = page.locator('[data-test-id="browse-events-button"]');
    await expect(browseEventsBtn).toBeVisible();
    await browseEventsBtn.click();
  }

  // Test category pill interactions (visible on both mobile and desktop)
  await expect(page.locator('[data-test-id="category-pills"]')).toBeVisible();

  // Click on a category pill and verify it works
  const workshopPill = page.locator('[data-test-id="category-pill-workshop"]');
  await expect(workshopPill).toBeVisible();
  await workshopPill.click();

  // Wait for potential filtering to complete
  await page.waitForTimeout(1000);

  // Verify we're still on the page (didn't crash)
  await expect(page.locator('[data-test-id="upcoming-events-section"]')).toBeVisible();

  console.log('Navigation interactions work properly');
});
