import { test, expect, devices } from '@playwright/test';
import {
    VIEWPORTS,
    testTouchInteraction,
    testNavigationResponsiveness,
    testFormResponsiveness,
    checkResponsiveImages,
    testScrollBehavior
} from './utils/browser-testing';

/**
 * Mobile Testing Suite
 * Tests LocalLoop functionality across mobile devices and touch interactions
 */

test.describe('Mobile Device Testing', () => {

    test.describe('iPhone Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on iPhone', async ({ page }) => {
            await page.goto('/');

            // Check core elements are visible
            await expect(page.locator('h1')).toContainText('LocalLoop');
            await expect(page.locator('h2')).toContainText('Upcoming Events');

            // Test navigation responsiveness
            await testNavigationResponsiveness(page, VIEWPORTS.mobile);

            // Check images load properly
            await checkResponsiveImages(page);

            // Test scroll behavior
            await testScrollBehavior(page, VIEWPORTS.mobile);
        });

        test('should handle touch interactions on iPhone', async ({ page }) => {
            await page.goto('/');

            // Test touch interactions on event cards
            const eventCards = page.locator('[data-testid="event-card"]');
            const firstCard = eventCards.first();

            if (await firstCard.count() > 0) {
                await testTouchInteraction(page, '[data-testid="event-card"]');

                // Verify navigation worked
                await expect(page).toHaveURL(/\/events\/.+/);
            }
        });

        test('should handle forms correctly on iPhone', async ({ page }) => {
            await page.goto('/auth/login');

            // Test form responsiveness
            await testFormResponsiveness(page, 'form', VIEWPORTS.mobile);

            // Test touch interactions on form elements
            await testTouchInteraction(page, 'input[type="email"]');
            await testTouchInteraction(page, 'input[type="password"]');

            // Check submit button is accessible
            const submitButton = page.locator('button[type="submit"]');
            await expect(submitButton).toBeVisible();
            await testTouchInteraction(page, 'button[type="submit"]');
        });
    });

    test.describe('iPad Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on iPad', async ({ page }) => {
            await page.goto('/');

            // Check layout adjusts for tablet
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('h2')).toContainText('Upcoming Events');

            // Test navigation for tablet view
            await testNavigationResponsiveness(page, VIEWPORTS.tablet);

            // Check event grid layout
            const eventGrid = page.locator('[data-testid="event-grid"]');
            if (await eventGrid.count() > 0) {
                await expect(eventGrid).toBeVisible();
            }
        });

        test('should handle tablet-specific interactions', async ({ page }) => {
            await page.goto('/');

            // Test that hover states work appropriately on tablet
            const eventCards = page.locator('[data-testid="event-card"]');
            if (await eventCards.count() > 0) {
                await eventCards.first().hover();
                await testTouchInteraction(page, '[data-testid="event-card"]');
            }
        });
    });

    test.describe('Android Testing', () => {
        // Device configuration handled in playwright.config.ts

        test('should display homepage correctly on Android', async ({ page }) => {
            await page.goto('/');

            // Check core functionality
            await expect(page.locator('h1')).toContainText('LocalLoop');
            await expect(page.locator('h2')).toContainText('Upcoming Events');

            // Test Android-specific navigation
            await testNavigationResponsiveness(page, VIEWPORTS.mobile);

            // Test scroll behavior on Android
            await testScrollBehavior(page, VIEWPORTS.mobile);
        });

        test('should handle Android touch gestures', async ({ page }) => {
            await page.goto('/');

            // Test pull-to-refresh behavior (if implemented)
            await page.touchscreen.tap(200, 100);
            await page.mouse.move(200, 100);
            await page.mouse.down();
            await page.mouse.move(200, 300);
            await page.mouse.up();

            // Test swipe gestures on event cards
            const eventCards = page.locator('[data-testid="event-card"]');
            if (await eventCards.count() > 0) {
                const firstCard = eventCards.first();
                const boundingBox = await firstCard.boundingBox();

                if (boundingBox) {
                    // Swipe right
                    await page.touchscreen.tap(boundingBox.x + 50, boundingBox.y + 50);
                    await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
                    await page.mouse.down();
                    await page.mouse.move(boundingBox.x + 200, boundingBox.y + 50);
                    await page.mouse.up();
                }
            }
        });
    });

    test.describe('Mobile Event Pages', () => {
        // Device configuration handled in playwright.config.ts

        test('should display event details correctly on mobile', async ({ page }) => {
            await page.goto('/');

            // Navigate to an event
            const eventCards = page.locator('[data-testid="event-card"]');
            if (await eventCards.count() > 0) {
                await testTouchInteraction(page, '[data-testid="event-card"]');

                // Check event page elements
                await expect(page.locator('h1')).toBeVisible();

                // Test RSVP button if present
                const rsvpButton = page.locator('button').filter({ hasText: /RSVP|Reserve/ });
                if (await rsvpButton.count() > 0) {
                    await expect(rsvpButton).toBeVisible();
                    await testTouchInteraction(page, 'button:has-text("RSVP"), button:has-text("Reserve")');
                }

                // Test share functionality if present
                const shareButton = page.locator('button').filter({ hasText: /Share/ });
                if (await shareButton.count() > 0) {
                    await testTouchInteraction(page, 'button:has-text("Share")');
                }
            }
        });
    });

    test.describe('Mobile Authentication', () => {
        // Device configuration handled in playwright.config.ts

        test('should handle mobile login flow', async ({ page }) => {
            await page.goto('/auth/login');

            // Test form interactions
            await testFormResponsiveness(page, 'form', VIEWPORTS.mobile);

            // Test keyboard behavior
            const emailInput = page.locator('input[type="email"]');
            if (await emailInput.count() > 0) {
                await testTouchInteraction(page, 'input[type="email"]');
                await emailInput.fill('test@example.com');

                // Check virtual keyboard doesn't break layout
                const form = page.locator('form');
                await expect(form).toBeVisible();
            }

            const passwordInput = page.locator('input[type="password"]');
            if (await passwordInput.count() > 0) {
                await testTouchInteraction(page, 'input[type="password"]');
                await passwordInput.fill('testpassword');
            }
        });

        test('should handle Google login on mobile', async ({ page }) => {
            await page.goto('/auth/login');

            // Test Google login button
            const googleButton = page.locator('button').filter({ hasText: /Google|Continue with Google/ });
            if (await googleButton.count() > 0) {
                await expect(googleButton).toBeVisible();
                await testTouchInteraction(page, 'button:has-text("Google"), button:has-text("Continue with Google")');
            }
        });
    });

    test.describe('Mobile Performance', () => {
        // Device configuration handled in playwright.config.ts

        test('should load quickly on mobile devices', async ({ page }) => {
            const startTime = Date.now();
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;

            // Mobile should load within reasonable time (adjust threshold as needed)
            expect(loadTime).toBeLessThan(10000); // 10 seconds max

            // Check for essential content
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('h2')).toBeVisible();
        });

        test('should handle mobile network conditions', async ({ page }) => {
            // Simulate slow 3G connection
            await page.route('**/*', async (route) => {
                await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
                await route.continue();
            });

            await page.goto('/');

            // Check that essential content still loads
            await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
        });
    });

    test.describe('Mobile Accessibility', () => {
        test.use({ ...devices['iPhone 12'] });

        test('should be accessible on mobile devices', async ({ page }) => {
            await page.goto('/');

            // Check for proper touch targets (min 44px)
            const buttons = page.locator('button, a, input[type="submit"]');
            const buttonCount = await buttons.count();

            for (let i = 0; i < Math.min(buttonCount, 5); i++) {
                const button = buttons.nth(i);
                const boundingBox = await button.boundingBox();

                if (boundingBox) {
                    expect(boundingBox.height).toBeGreaterThanOrEqual(44);
                    expect(boundingBox.width).toBeGreaterThanOrEqual(44);
                }
            }

            // Check for proper focus indicators
            await page.keyboard.press('Tab');
            const focusedElement = page.locator(':focus');
            if (await focusedElement.count() > 0) {
                await expect(focusedElement).toBeVisible();
            }
        });

        test('should support screen reader navigation', async ({ page }) => {
            await page.goto('/');

            // Check for proper heading hierarchy
            const h1Count = await page.locator('h1').count();
            expect(h1Count).toBeGreaterThanOrEqual(1);
            expect(h1Count).toBeLessThanOrEqual(1);

            // Check for alt text on images
            const images = page.locator('img');
            const imageCount = await images.count();

            for (let i = 0; i < Math.min(imageCount, 5); i++) {
                const img = images.nth(i);
                const alt = await img.getAttribute('alt');
                expect(alt).toBeDefined();
            }
        });
    });

    test.describe('Mobile Orientation', () => {
        test.use({ ...devices['iPhone 12'] });

        test('should handle orientation changes', async ({ page }) => {
            await page.goto('/');

            // Test portrait mode (default)
            await expect(page.locator('h1')).toBeVisible();

            // Simulate landscape mode
            await page.setViewportSize({ width: 844, height: 390 });
            await page.waitForTimeout(500);

            // Check layout adapts to landscape
            await expect(page.locator('h1')).toBeVisible();
            await expect(page.locator('h2')).toBeVisible();

            // Switch back to portrait
            await page.setViewportSize({ width: 390, height: 844 });
            await page.waitForTimeout(500);

            // Verify layout returns to portrait mode
            await expect(page.locator('h1')).toBeVisible();
        });
    });

    test.describe('Mobile Edge Cases', () => {
        test.use({ ...devices['iPhone 12'] });

        test('should handle mobile browser quirks', async ({ page }) => {
            await page.goto('/');

            // Test viewport meta tag effectiveness
            const viewport = await page.evaluate(() => {
                const meta = document.querySelector('meta[name="viewport"]');
                return meta ? meta.getAttribute('content') : null;
            });

            expect(viewport).toBeTruthy();
            expect(viewport).toContain('width=device-width');

            // Test that zoom is disabled (for better UX)
            if (viewport) {
                expect(viewport).toContain('user-scalable=no');
            }
        });

        test('should handle touch events properly', async ({ page }) => {
            await page.goto('/');

            // Test touch event handling
            await page.evaluate(() => {
                window.touchEventsSupported = 'ontouchstart' in window;
            });

            const touchSupported = await page.evaluate(() => window.touchEventsSupported);
            expect(touchSupported).toBe(true);
        });
    });
}); 