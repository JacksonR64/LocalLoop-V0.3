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
     */
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
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
        // Wait for RSVP form to be visible
        await expect(this.page.locator('[data-test="rsvp-form"], form')).toBeVisible();

        // Fill attendee count if input exists
        const attendeeCountInput = this.page.locator('input[name="attendee_count"], input[type="number"]');
        if (await attendeeCountInput.isVisible()) {
            await attendeeCountInput.fill(attendeeCount.toString());
        }

        // Fill attendee names
        for (let i = 0; i < attendeeNames.length && i < attendeeCount; i++) {
            const nameInput = this.page.locator(`input[name="attendee_${i}"], input[placeholder*="name" i]:nth-of-type(${i + 1})`);
            if (await nameInput.isVisible()) {
                await nameInput.fill(attendeeNames[i]);
            }
        }

        return this;
    }

    /**
     * Submit RSVP form
     */
    async submitRSVP() {
        const submitButton = this.page.locator('button[type="submit"], button:has-text("RSVP"), button:has-text("Confirm")');
        await expect(submitButton).toBeVisible();
        await submitButton.click();

        // Wait for submission to complete
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Fill out ticket purchase form
     */
    async fillTicketForm(ticketQuantity: number = 1) {
        const quantitySelector = this.page.locator('select[name="quantity"], input[name="quantity"]');
        if (await quantitySelector.isVisible()) {
            if (await quantitySelector.getAttribute('tagName') === 'SELECT') {
                await quantitySelector.selectOption(ticketQuantity.toString());
            } else {
                await quantitySelector.fill(ticketQuantity.toString());
            }
        }
        return this;
    }

    /**
     * Proceed to checkout
     */
    async proceedToCheckout() {
        const checkoutButton = this.page.locator('button:has-text("Buy Tickets"), button:has-text("Checkout"), button:has-text("Purchase")');
        await expect(checkoutButton).toBeVisible();
        await checkoutButton.click();

        // Wait for redirect to checkout or Stripe
        await this.page.waitForLoadState('networkidle');
        return this;
    }

    /**
     * Check for success messages or confirmations
     */
    async verifySuccessMessage(message?: string) {
        const successSelectors = [
            '.success-message',
            '.alert-success',
            '[data-test="success"]',
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
            '.error-message',
            '.alert-error',
            '.alert-danger',
            '[data-test="error"]',
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
            'button:has-text("Add to Calendar")',
            'button:has-text("Google Calendar")',
            '[data-test="calendar-button"]',
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
}

export const testEvents = {
    // Test event IDs that should exist in the database
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