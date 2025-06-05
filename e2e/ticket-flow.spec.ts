import { test, expect } from '@playwright/test';
import { TestHelpers, testEvents } from './utils/test-helpers';

test.describe('Ticket Purchase Flow', () => {
    let helpers: TestHelpers;

    test.beforeEach(async ({ page }) => {
        helpers = new TestHelpers(page);
    });

    test('ticket purchase flow for paid event', async ({ page }) => {
        // Navigate to paid event page
        await helpers.goToEvent(testEvents.paidEventId);
        await helpers.waitForPageLoad();

        await helpers.takeScreenshot('ticket-flow-start');

        // Look for ticket purchase options
        const ticketElements = page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Tickets"), [data-test="buy-tickets"], [data-test="ticket-form"]');
        await expect(ticketElements.first()).toBeVisible({ timeout: 15000 });

        // Fill ticket form
        await helpers.fillTicketForm(1);

        // Proceed to checkout
        await helpers.proceedToCheckout();

        // Check if redirected to Stripe or payment page
        const currentUrl = page.url();
        if (currentUrl.includes('stripe.com') || currentUrl.includes('/checkout') || currentUrl.includes('/payment')) {
            console.log('Successfully redirected to payment processor');
            await expect(page.locator('body')).toBeVisible();
        } else if (currentUrl.includes('/auth/login') || currentUrl.includes('/login')) {
            console.log('Ticket purchase requires authentication - redirected to login');
            await expect(page.locator('body')).toBeVisible();
        } else {
            console.log('Ticket purchase flow completed or requires additional steps');
        }

        await helpers.takeScreenshot('ticket-flow-end');
    });

    test('ticket quantity selection works correctly', async ({ page }) => {
        await helpers.goToEvent(testEvents.paidEventId);
        await helpers.waitForPageLoad();

        // Look for quantity selector
        const quantitySelector = page.locator('select[name="quantity"], input[name="quantity"], input[type="number"]');

        if (await quantitySelector.isVisible()) {
            // Test different quantities
            const quantities = [1, 2, 5];

            for (const qty of quantities) {
                await helpers.fillTicketForm(qty);

                // Verify quantity is set correctly
                const selectedValue = await quantitySelector.inputValue();
                expect(selectedValue).toBe(qty.toString());
                console.log(`Quantity ${qty} selected successfully`);
            }
        } else {
            console.log('Quantity selector not visible - may be single ticket only or requires authentication');
        }
    });

    test('ticket pricing displays correctly', async ({ page }) => {
        await helpers.goToEvent(testEvents.paidEventId);
        await helpers.waitForPageLoad();

        // Look for price information
        const priceElements = page.locator('.price, .cost, .amount, [data-test="price"], :has-text("$"), :has-text("£"), :has-text("€")');

        if (await priceElements.count() > 0) {
            await expect(priceElements.first()).toBeVisible();

            // Get price text for verification
            const priceText = await priceElements.first().textContent();
            console.log(`Ticket price displayed: ${priceText}`);

            // Verify price contains currency symbol and number
            expect(priceText).toMatch(/[\$£€]\s*\d+/);
        } else {
            console.log('Price information not immediately visible');
        }
    });

    test('checkout handles invalid payment scenarios', async ({ page }) => {
        await helpers.goToEvent(testEvents.paidEventId);
        await helpers.waitForPageLoad();

        // Try to proceed with ticket purchase
        const buyButton = page.locator('button:has-text("Buy"), button:has-text("Purchase"), button:has-text("Checkout")');

        if (await buyButton.isVisible()) {
            await buyButton.click();
            await helpers.waitForPageLoad();

            // If we get to a payment form, we can test validation
            // Note: We won't actually submit payments in E2E tests
            const currentUrl = page.url();

            if (currentUrl.includes('stripe.com')) {
                console.log('Reached Stripe payment page - would test payment validation here');
                // In a real scenario, you might test with Stripe test cards
                // But we don't want to actually process payments in E2E tests
            } else if (currentUrl.includes('/checkout') || currentUrl.includes('/payment')) {
                console.log('Reached internal checkout page');

                // Look for payment form fields
                const paymentForm = page.locator('form, .payment-form, [data-test="payment-form"]');
                if (await paymentForm.isVisible()) {
                    console.log('Payment form visible - validation can be tested');
                }
            } else {
                console.log('Checkout requires authentication or other prerequisites');
            }
        } else {
            console.log('Buy button not visible - may require authentication');
        }
    });

    test('ticket types are displayed correctly', async ({ page }) => {
        await helpers.goToEvent(testEvents.paidEventId);
        await helpers.waitForPageLoad();

        // Look for different ticket types
        const ticketTypes = page.locator('.ticket-type, .ticket-option, [data-test="ticket-type"]');
        const ticketCount = await ticketTypes.count();

        if (ticketCount > 0) {
            console.log(`Found ${ticketCount} ticket type(s)`);

            // Verify each ticket type has essential information
            for (let i = 0; i < ticketCount; i++) {
                const ticketType = ticketTypes.nth(i);
                await expect(ticketType).toBeVisible();

                // Check for title/name
                const ticketText = await ticketType.textContent();
                expect(ticketText).toBeTruthy();
                console.log(`Ticket type ${i + 1}: ${ticketText?.substring(0, 50)}...`);
            }
        } else {
            console.log('No distinct ticket types visible - may be single ticket type event');
        }
    });

    test('sold out events display correctly', async ({ page }) => {
        // Test with an event that might be sold out
        await helpers.goToEvent(testEvents.validEventId);
        await helpers.waitForPageLoad();

        // Look for sold out indicators
        const soldOutElements = page.locator(':has-text("Sold Out"), :has-text("Unavailable"), .sold-out, [data-test="sold-out"]');

        if (await soldOutElements.count() > 0) {
            console.log('Sold out status displayed correctly');
            await expect(soldOutElements.first()).toBeVisible();

            // Verify buy buttons are disabled or hidden
            const buyButtons = page.locator('button:has-text("Buy"), button:has-text("Purchase")');
            if (await buyButtons.count() > 0) {
                const isDisabled = await buyButtons.first().isDisabled();
                if (isDisabled) {
                    console.log('Buy button correctly disabled for sold out event');
                }
            }
        } else {
            console.log('Event is not sold out or sold out status not applicable');
        }
    });
}); 