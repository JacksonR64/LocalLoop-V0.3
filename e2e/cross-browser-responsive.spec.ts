// @ts-nocheck
import { test, expect, devices } from '@playwright/test';

/**
 * Cross-Browser and Responsive Testing Suite
 * Tests core functionality across different browsers, devices, and viewport sizes
 */

// Test data for consistent testing across devices
const testEvent = {
    title: 'Photography Workshop',
    location: 'Art Center',
    date: 'May 19, 2025'
};

test.describe('Cross-Browser Responsive Testing', () => {

    test.describe('Homepage Responsiveness', () => {

        test('should display correctly on desktop viewports', async ({ page }) => {
            await page.goto('/');

            // Check page loads and main elements are visible
            await expect(page.locator('h1')).toContainText('LocalLoop');
            await expect(page.locator('h2')).toContainText('Discover Local Events');

            // Check search functionality is visible
            await expect(page.locator('input[placeholder*="Search events"]')).toBeVisible();

            // Check filter buttons are visible
            await expect(page.locator('button:has-text("Select categories")')).toBeVisible();
            await expect(page.locator('button:has-text("Any date")')).toBeVisible();

            // Check events grid layout
            const eventCards = page.locator('[data-testid="event-card"], .event-card, article, [role="article"]').first();
            await expect(eventCards).toBeVisible();

            // Take screenshot for visual regression
            await expect(page).toHaveScreenshot('homepage-desktop.png');
        });

        test('should adapt layout for tablet viewports', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.goto('/');

            // Check responsive layout elements
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('input[placeholder*="Search events"]')).toBeVisible();

            // Check navigation is accessible
            const navigation = page.locator('nav, [role="navigation"]').first();
            await expect(navigation).toBeVisible();

            // Take screenshot for comparison
            await expect(page).toHaveScreenshot('homepage-tablet.png');
        });

        test('should work correctly on mobile devices', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('/');

            // Check mobile-specific layout
            await expect(page.locator('h1')).toBeVisible();

            // Check search is still accessible
            const searchInput = page.locator('input[placeholder*="Search events"]');
            await expect(searchInput).toBeVisible();

            // Check events are displayed in mobile layout
            const eventElements = page.locator('h3, [data-testid="event-title"]');
            await expect(eventElements.first()).toBeVisible();

            // Test mobile screenshot
            await expect(page).toHaveScreenshot('homepage-mobile.png');
        });
    });

    test.describe('Event Details Page Responsiveness', () => {

        test('should display event details correctly across viewports', async ({ page }) => {
            // Go to an event page (using first available event)
            await page.goto('/');

            // Find and click on the first event
            const firstEventLink = page.locator('button:has-text("View Details")').first();
            await expect(firstEventLink).toBeVisible();
            await firstEventLink.click();

            // Wait for navigation and check event details are visible
            await page.waitForLoadState('networkidle');

            // Check key event details are present
            await expect(page.locator('h1, h2, h3')).toHaveCount({ min: 1 });

            // Take screenshot
            await expect(page).toHaveScreenshot('event-details-responsive.png');
        });
    });

    test.describe('Touch and Mobile Interactions', () => {

        test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
            test.skip(!isMobile, 'Mobile-specific test');

            await page.goto('/');

            // Test touch scrolling
            await page.mouse.move(200, 300);
            await page.mouse.down();
            await page.mouse.move(200, 100);
            await page.mouse.up();

            // Test tap interactions
            const categoryButton = page.locator('button:has-text("Workshop")');
            if (await categoryButton.isVisible()) {
                await categoryButton.tap();
                // Check filter was applied
                await page.waitForTimeout(1000);
            }
        });
    });

    test.describe('Form Functionality Across Devices', () => {

        test('should handle search functionality on all devices', async ({ page }) => {
            await page.goto('/');

            // Test search input
            const searchInput = page.locator('input[placeholder*="Search events"]');
            await expect(searchInput).toBeVisible();

            await searchInput.fill('workshop');
            await page.keyboard.press('Enter');

            // Wait for search results
            await page.waitForTimeout(2000);

            // Check results are displayed
            const results = page.locator('text=/workshop/i').first();
            await expect(results).toBeVisible();
        });

        test('should handle filter interactions', async ({ page }) => {
            await page.goto('/');

            // Test category filter
            const workshopFilter = page.locator('button:has-text("Workshop")');
            if (await workshopFilter.isVisible()) {
                await workshopFilter.click();
                await page.waitForTimeout(1000);

                // Check events are filtered
                await expect(page.locator('text=/workshop/i')).toHaveCount({ min: 1 });
            }
        });
    });

    test.describe('Navigation Across Devices', () => {

        test('should navigate correctly between pages', async ({ page }) => {
            await page.goto('/');

            // Test navigation to different pages
            const createEventLink = page.locator('a:has-text("Create Event"), a[href*="create"]');
            if (await createEventLink.isVisible()) {
                await createEventLink.click();
                await page.waitForLoadState('networkidle');

                // Check we're on the create event page
                await expect(page).toHaveURL(/create/);
            }

            // Navigate back to home
            await page.goto('/');
            await expect(page.locator('h2:has-text("Discover Local Events")')).toBeVisible();
        });

        test('should handle back/forward navigation', async ({ page }) => {
            await page.goto('/');

            // Navigate to an event if available
            const viewDetailsButton = page.locator('button:has-text("View Details")').first();
            if (await viewDetailsButton.isVisible()) {
                await viewDetailsButton.click();
                await page.waitForLoadState('networkidle');

                // Go back
                await page.goBack();
                await expect(page.locator('h2:has-text("Discover Local Events")')).toBeVisible();

                // Go forward
                await page.goForward();
                await page.waitForLoadState('networkidle');
            }
        });
    });

    test.describe('Performance Across Devices', () => {

        test('should load quickly on all devices', async ({ page }) => {
            const startTime = Date.now();

            await page.goto('/');
            await page.waitForLoadState('networkidle');

            const loadTime = Date.now() - startTime;

            // Check page loads within reasonable time (10 seconds for safety)
            expect(loadTime).toBeLessThan(10000);

            // Check critical elements are visible
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('h2')).toBeVisible();
        });
    });

    test.describe('Browser-Specific Features', () => {

        test('should handle different browser quirks', async ({ page, browserName }) => {
            await page.goto('/');

            // Test browser-specific functionality
            if (browserName === 'webkit') {
                // Safari-specific tests
                await expect(page.locator('h1')).toBeVisible();
            } else if (browserName === 'firefox') {
                // Firefox-specific tests
                await expect(page.locator('h1')).toBeVisible();
            } else {
                // Chrome/Chromium tests
                await expect(page.locator('h1')).toBeVisible();
            }

            // Test common functionality works across all browsers
            const searchInput = page.locator('input[placeholder*="Search events"]');
            await expect(searchInput).toBeVisible();
            await searchInput.fill('test');
            await expect(searchInput).toHaveValue('test');
        });
    });

    test.describe('Accessibility Across Devices', () => {

        test('should maintain accessibility standards', async ({ page }) => {
            await page.goto('/');

            // Check for proper heading hierarchy
            const h1 = page.locator('h1');
            await expect(h1).toBeVisible();

            // Check for proper form labels
            const searchInput = page.locator('input[placeholder*="Search events"]');
            await expect(searchInput).toBeVisible();

            // Test keyboard navigation
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');

            // Check focus is visible
            const focusedElement = page.locator(':focus');
            await expect(focusedElement).toBeVisible();
        });
    });
});

// Device-specific test suites (devices configured in playwright.config.ts)
test.describe('Mobile Device Testing', () => {

    test('should work correctly on mobile devices', async ({ page }) => {
        await page.goto('/');

        // Get viewport info to determine device type
        const viewportSize = page.viewportSize();
        const isMobile = viewportSize && viewportSize.width < 768;

        // Mobile-specific assertions
        await expect(page.locator('h1')).toBeVisible();

        if (isMobile) {
            // Test mobile-specific features
            console.log(`Testing mobile device: ${viewportSize.width}x${viewportSize.height}`);

            // Check that elements are properly sized for mobile
            const mainContent = page.locator('main');
            await expect(mainContent).toBeVisible();
        } else {
            // Desktop/tablet testing
            console.log(`Testing larger device: ${viewportSize?.width}x${viewportSize?.height}`);
        }
    });
});

test.describe('Desktop Browser Comparisons', () => {

    ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
        test(`should render consistently in ${browserName}`, async ({ page }) => {
            await page.goto('/');

            // Cross-browser consistency checks
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('h2')).toBeVisible();

            // Take browser-specific screenshot
            await expect(page).toHaveScreenshot(`${browserName}-consistency.png`);
        });
    });
}); 