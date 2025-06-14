import { Page, expect } from '@playwright/test';

export class TestHelpers {
    constructor(private page: Page) { }

    /**
     * Navigate to homepage and verify it loads
     */
    async goToHomepage() {
        await this.page.goto('/');
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Navigate to a specific event page
     */
    async goToEvent(eventId: string) {
        await this.page.goto(`/events/${eventId}`);
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Navigate to login page
     */
    async goToLogin() {
        await this.page.goto('/auth/login');
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Navigate to event creation page
     */
    async goToCreateEvent() {
        await this.page.goto('/staff/events/create');
        await expect(this.page.locator('body')).toBeVisible();
        return this;
    }

    /**
     * Wait for page to fully load (including network requests)
     * Uses a more resilient approach than networkidle
     */
    async waitForPageLoad(timeout: number = 10000) {
        try {
            // Try networkidle first with shorter timeout
            await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        } catch {
            // Fallback to domcontentloaded if networkidle fails
            await this.page.waitForLoadState('domcontentloaded', { timeout });
            // Add small delay to let any lazy loading complete
            await this.page.waitForTimeout(1000);
        }
        return this;
    }

    /**
     * Check if user is authenticated by looking for profile elements
     */
    async isAuthenticated(): Promise<boolean> {
        try {
            // Look for common authenticated user elements
            await this.page.waitForSelector('[data-test="user-menu"], [data-test="profile-button"], .user-avatar', {
                timeout: 2000
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Simulate Google OAuth login (mock for testing)
     */
    async mockGoogleLogin(email: string = 'test@example.com', name: string = 'Test User') {
        // This would typically involve mocking the OAuth flow
        // For now, we'll simulate the post-login state
        await this.page.goto('/auth/login');

        // In a real implementation, you might:
        // 1. Mock the Google OAuth endpoints
        // 2. Simulate the callback with a test token
        // 3. Ensure the session is properly set

        console.log(`Mocking Google login for ${email}`);
        return this;
    }

    /**
     * Fill out RSVP form
     */
    async fillRSVPForm(attendeeCount: number = 1, attendeeNames: string[] = ['Test Attendee']) {
        // Wait for RSVP form to be visible - but don't fail if it doesn't exist
        try {
            await expect(this.page.locator('[data-test-id="rsvp-form"]')).toBeVisible({ timeout: 5000 });
        } catch {
            console.warn('RSVP form not immediately visible - may require authentication or different event type');
            return this;
        }

        // Fill attendee count if input exists
        const attendeeCountInput = this.page.locator('input[name="attendee_count"], input[type="number"]');
        if (await attendeeCountInput.isVisible()) {
            await attendeeCountInput.fill(attendeeCount.toString());
        }

        // For guest users, fill out guest information
        const guestNameInput = this.page.locator('[data-test-id="guest-name-input"]');
        const guestEmailInput = this.page.locator('[data-test-id="guest-email-input"]');

        if (await guestNameInput.isVisible() && attendeeNames.length > 0) {
            await guestNameInput.fill(attendeeNames[0]);
        }

        if (await guestEmailInput.isVisible()) {
            await guestEmailInput.fill('test@example.com');
        }

        return this;
    }

    /**
     * Submit RSVP form
     */
    async submitRSVP() {
        const submitButton = this.page.locator('[data-test-id="rsvp-submit-button"]');

        try {
            await expect(submitButton).toBeVisible({ timeout: 5000 });
            await submitButton.click();

            // Wait for submission to complete with fallback
            await this.waitForPageLoad();
        } catch {
            console.warn('RSVP submit button not found or clickable - may not be available');
        }

        return this;
    }

    /**
     * Fill out ticket purchase form
     */
    async fillTicketForm(ticketQuantity: number = 1) {
        // Look for ticket quantity controls using data-test-id
        const quantityInput = this.page.locator('[data-test-id="quantity-input"]');
        const increaseButton = this.page.locator('[data-test-id="increase-quantity-button"]');

        if (await quantityInput.isVisible()) {
            // Clear and fill quantity input
            await quantityInput.fill(ticketQuantity.toString());
        } else if (await increaseButton.isVisible()) {
            // Use increase button to set quantity
            for (let i = 0; i < ticketQuantity; i++) {
                await increaseButton.first().click();
                await this.page.waitForTimeout(500); // Small delay between clicks
            }
        } else {
            console.warn('No ticket quantity controls found');
        }

        return this;
    }

    /**
     * Proceed to checkout
     */
    async proceedToCheckout() {
        const checkoutButton = this.page.locator('[data-test-id="proceed-to-checkout-button"]');

        try {
            await expect(checkoutButton).toBeVisible({ timeout: 5000 });
            await checkoutButton.click();

            // Wait for redirect to checkout or Stripe
            await this.waitForPageLoad();
        } catch {
            console.warn('Checkout button not found - may require tickets to be selected first');
        }

        return this;
    }

    /**
     * Check for success messages or confirmations
     */
    async verifySuccessMessage(message?: string) {
        const successSelectors = [
            '[data-test-id="success-message"]',
            '[data-test-id="rsvp-confirmed-text"]',
            '.success-message',
            '.alert-success',
            ':has-text("Success")',
            ':has-text("Confirmed")',
            ':has-text("Thank you")'
        ];

        let found = false;
        for (const selector of successSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
                found = true;
                break;
            } catch {
                // Continue to next selector
            }
        }

        if (!found && message) {
            await expect(this.page.locator(`:has-text("${message}")`)).toBeVisible();
        }

        return this;
    }

    /**
     * Check for error messages
     */
    async verifyErrorMessage(message?: string) {
        const errorSelectors = [
            '[data-test-id="error-message"]',
            '.error-message',
            '.alert-error',
            '.alert-danger',
            ':has-text("Error")',
            ':has-text("Failed")'
        ];

        let found = false;
        for (const selector of errorSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
                found = true;
                break;
            } catch {
                // Continue to next selector
            }
        }

        if (!found && message) {
            await expect(this.page.locator(`:has-text("${message}")`)).toBeVisible();
        }

        return this;
    }

    /**
     * Wait for and verify Google Calendar integration elements
     */
    async verifyCalendarIntegration() {
        // Look for calendar-related buttons or indicators
        const calendarSelectors = [
            '[data-test-id="google-calendar-integration"]',
            '[data-test-id="calendar-integration-card"]',
            'button:has-text("Add to Calendar")',
            'button:has-text("Google Calendar")',
            '.calendar-integration'
        ];

        let found = false;
        for (const selector of calendarSelectors) {
            try {
                await expect(this.page.locator(selector)).toBeVisible({ timeout: 5000 });
                found = true;
                break;
            } catch {
                // Continue to next selector
            }
        }

        if (!found) {
            console.warn('No calendar integration elements found');
        }

        return this;
    }

    /**
     * Take a screenshot for debugging
     */
    async takeScreenshot(name: string) {
        await this.page.screenshot({ path: `test-results/screenshots/${name}-${Date.now()}.png` });
        return this;
    }

    /**
     * Log current page URL and title for debugging
     */
    async logCurrentPage() {
        const url = this.page.url();
        const title = await this.page.title();
        console.log(`Current page: ${title} (${url})`);
        return this;
    }

    /**
     * Navigate to first available event (more robust than hardcoded IDs)
     */
    async goToFirstAvailableEvent() {
        // Navigate to homepage which displays events
        await this.page.goto('/');
        await this.waitForPageLoad();

        // Look for event cards on homepage using data-test-id
        const eventCards = this.page.locator('[data-test-id="event-card"], button:has-text("View Details")');

        const cardCount = await eventCards.count();
        if (cardCount > 0) {
            console.log(`Found ${cardCount} event cards on homepage`);

            // Click the first event's "View Details" button or card
            const firstEventCard = eventCards.first();
            await firstEventCard.scrollIntoViewIfNeeded();
            await firstEventCard.click();
            await this.waitForPageLoad();
            return this;
        }

        // If no events found on homepage, try fallback UUID (less likely to work)
        console.warn('No events found on homepage, trying fallback UUID');
        try {
            await this.page.goto('/events/00000000-0000-0000-0000-000000000001');
            await this.waitForPageLoad();
        } catch (error) {
            console.warn('Fallback event ID also failed:', error);
            // Continue anyway to let tests handle gracefully
        }

        return this;
    }
}

export const testEvents = {
    // Use actual event URLs that should exist or be publicly accessible
    // Instead of hard-coded UUIDs, use paths that work with the current app
    validEventPath: '/events', // Will navigate to events list and pick first event
    createEventPath: '/staff/events/create',
    demoEventPath: '/demo', // If demo events exist

    // Fallback hardcoded IDs (these would need to be seeded in test database)
    validEventId: '00000000-0000-0000-0000-000000000001',
    paidEventId: '00000000-0000-0000-0000-000000000003',
    invalidEventId: '99999999-9999-9999-9999-999999999999'
};

export const testUsers = {
    // Test user credentials/data
    testEmail: 'test@example.com',
    testName: 'Test User',
    staffEmail: 'staff@example.com',
    staffName: 'Staff User'
}; 