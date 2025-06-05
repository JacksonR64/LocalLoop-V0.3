# Test info

- Name: Cross-Browser Responsive Testing >> Homepage Responsiveness >> should display correctly on desktop viewports
- Location: /Users/jacksonrhoden/Code/LocalLoop-V0.3/e2e/cross-browser-responsive.spec.ts:19:13

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid="event-card"], .event-card, article, [role="article"]').first()
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('[data-testid="event-card"], .event-card, article, [role="article"]').first()

    at /Users/jacksonrhoden/Code/LocalLoop-V0.3/e2e/cross-browser-responsive.spec.ts:35:38
```

# Page snapshot

```yaml
- banner:
  - link "LocalLoop":
    - /url: /
    - heading "LocalLoop" [level=1]
  - navigation:
    - button "Browse Events"
    - link "Create Event":
      - /url: /create-event
    - link "My Events":
      - /url: /my-events
    - link "Sign In":
      - /url: /auth/login
- heading "Discover Local Events" [level=2]
- paragraph: Connect with your community through amazing local events. From workshops to social gatherings, find your next adventure.
- textbox "Search events..."
- button "Select categories..."
- button "Any date"
- button "All Events"
- button "Sort events": Date (Earliest First)
- text: Showing all 12 events
- button "Workshop"
- button "Community"
- button "Arts"
- button "Business"
- button "Family"
- main:
  - heading "Upcoming Events" [level=3]
  - button "View All →"
  - img "Photography Workshop"
  - heading "Photography Workshop" [level=3]
  - text: Past
  - paragraph: Learn digital photography fundamentals and editing
  - text: May 19, 2025 at 11:00 AM Art Center 2 attending • 16 spots left workshop by LocalLoop Events
  - button "View Details"
  - img "Senior Citizens Social Hour"
  - heading "Senior Citizens Social Hour" [level=3]
  - text: Past
  - paragraph: Weekly social gathering for senior citizens
  - text: May 26, 2025 at 9:00 AM Community Center 1 attending • 34 spots left social by Community Center
  - button "View Details"
  - img "Community Garden Workshop"
  - heading "Community Garden Workshop" [level=3]
  - paragraph: Learn sustainable gardening and grow your own vegetables
  - text: June 7, 2025 at 6:00 PM Green Valley Community Center 2 attending • 28 spots left workshop by Community Center
  - button "View Details"
  - img "Local Business Networking"
  - heading "Local Business Networking" [level=3]
  - text: Paid
  - paragraph: Connect with local entrepreneurs and business owners
  - text: June 11, 2025 at 12:00 PM Downtown Business Hub 1 attending • 49 spots left business by Green Valley Library
  - button "View Details"
  - img "Kids Art Workshop"
  - heading "Kids Art Workshop" [level=3]
  - text: Paid
  - paragraph: Creative art workshop for children ages 6-12
  - text: June 15, 2025 at 6:00 PM Green Valley Library 1 attending • 19 spots left arts by Green Valley Library
  - button "View Details"
  - img "Book Club Meeting"
  - heading "Book Club Meeting" [level=3]
  - paragraph: Monthly book discussion - "The Seven Husbands of Evelyn Hugo"
  - text: June 21, 2025 at 7:00 PM Green Valley Library 1 attending • 14 spots left education by Green Valley Library
  - button "View Details"
  - img "Yoga in the Park"
  - heading "Yoga in the Park" [level=3]
  - paragraph: Outdoor yoga session suitable for all levels
  - text: June 28, 2025 at 5:00 PM Central Park 2 attending • 23 spots left sports by LocalLoop Events
  - button "View Details"
  - 'img "Learn Web Development: React Fundamentals Workshop"'
  - 'heading "Learn Web Development: React Fundamentals Workshop" [level=3]'
  - text: Paid
  - paragraph: "Hands-on workshop covering React basics, components, and modern development practices\" Description: \"Join us for an intensive 3-hour workshop where you'll learn the fundamentals of React development. We'll cover components, state management, props, and build a real project together. Perfect for beginners with basic JavaScript knowledge."
  - text: July 3, 2025 at 9:00 PM Apple Inc. 1 Apple Park Way, Cupertino, CA 95014, United States 0 attending • 25 spots left workshop by User
  - button "View Details"
- contentinfo:
  - link "LocalLoop":
    - /url: /
    - heading "LocalLoop" [level=4]
  - paragraph: Connecting communities through local events
  - link "About":
    - /url: /about
  - link "Privacy":
    - /url: /privacy
  - link "Terms":
    - /url: /terms
  - link "Contact":
    - /url: /contact
- alert: LocalLoop
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect, devices } from '@playwright/test';
   2 |
   3 | /**
   4 |  * Cross-Browser and Responsive Testing Suite
   5 |  * Tests core functionality across different browsers, devices, and viewport sizes
   6 |  */
   7 |
   8 | // Test data for consistent testing across devices
   9 | const testEvent = {
   10 |     title: 'Photography Workshop',
   11 |     location: 'Art Center',
   12 |     date: 'May 19, 2025'
   13 | };
   14 |
   15 | test.describe('Cross-Browser Responsive Testing', () => {
   16 |
   17 |     test.describe('Homepage Responsiveness', () => {
   18 |
   19 |         test('should display correctly on desktop viewports', async ({ page }) => {
   20 |             await page.goto('/');
   21 |
   22 |             // Check page loads and main elements are visible
   23 |             await expect(page.locator('h1')).toContainText('LocalLoop');
   24 |             await expect(page.locator('h2')).toContainText('Discover Local Events');
   25 |
   26 |             // Check search functionality is visible
   27 |             await expect(page.locator('input[placeholder*="Search events"]')).toBeVisible();
   28 |
   29 |             // Check filter buttons are visible
   30 |             await expect(page.locator('button:has-text("Select categories")')).toBeVisible();
   31 |             await expect(page.locator('button:has-text("Any date")')).toBeVisible();
   32 |
   33 |             // Check events grid layout
   34 |             const eventCards = page.locator('[data-testid="event-card"], .event-card, article, [role="article"]').first();
>  35 |             await expect(eventCards).toBeVisible();
      |                                      ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
   36 |
   37 |             // Take screenshot for visual regression
   38 |             await expect(page).toHaveScreenshot('homepage-desktop.png');
   39 |         });
   40 |
   41 |         test('should adapt layout for tablet viewports', async ({ page }) => {
   42 |             await page.setViewportSize({ width: 768, height: 1024 });
   43 |             await page.goto('/');
   44 |
   45 |             // Check responsive layout elements
   46 |             await expect(page.locator('h1')).toBeVisible();
   47 |             await expect(page.locator('input[placeholder*="Search events"]')).toBeVisible();
   48 |
   49 |             // Check navigation is accessible
   50 |             const navigation = page.locator('nav, [role="navigation"]').first();
   51 |             await expect(navigation).toBeVisible();
   52 |
   53 |             // Take screenshot for comparison
   54 |             await expect(page).toHaveScreenshot('homepage-tablet.png');
   55 |         });
   56 |
   57 |         test('should work correctly on mobile devices', async ({ page }) => {
   58 |             await page.setViewportSize({ width: 375, height: 667 });
   59 |             await page.goto('/');
   60 |
   61 |             // Check mobile-specific layout
   62 |             await expect(page.locator('h1')).toBeVisible();
   63 |
   64 |             // Check search is still accessible
   65 |             const searchInput = page.locator('input[placeholder*="Search events"]');
   66 |             await expect(searchInput).toBeVisible();
   67 |
   68 |             // Check events are displayed in mobile layout
   69 |             const eventElements = page.locator('h3, [data-testid="event-title"]');
   70 |             await expect(eventElements.first()).toBeVisible();
   71 |
   72 |             // Test mobile screenshot
   73 |             await expect(page).toHaveScreenshot('homepage-mobile.png');
   74 |         });
   75 |     });
   76 |
   77 |     test.describe('Event Details Page Responsiveness', () => {
   78 |
   79 |         test('should display event details correctly across viewports', async ({ page }) => {
   80 |             // Go to an event page (using first available event)
   81 |             await page.goto('/');
   82 |
   83 |             // Find and click on the first event
   84 |             const firstEventLink = page.locator('button:has-text("View Details")').first();
   85 |             await expect(firstEventLink).toBeVisible();
   86 |             await firstEventLink.click();
   87 |
   88 |             // Wait for navigation and check event details are visible
   89 |             await page.waitForLoadState('networkidle');
   90 |
   91 |             // Check key event details are present
   92 |             await expect(page.locator('h1, h2, h3')).toHaveCount({ min: 1 });
   93 |
   94 |             // Take screenshot
   95 |             await expect(page).toHaveScreenshot('event-details-responsive.png');
   96 |         });
   97 |     });
   98 |
   99 |     test.describe('Touch and Mobile Interactions', () => {
  100 |
  101 |         test('should handle touch interactions on mobile', async ({ page, isMobile }) => {
  102 |             test.skip(!isMobile, 'Mobile-specific test');
  103 |
  104 |             await page.goto('/');
  105 |
  106 |             // Test touch scrolling
  107 |             await page.mouse.move(200, 300);
  108 |             await page.mouse.down();
  109 |             await page.mouse.move(200, 100);
  110 |             await page.mouse.up();
  111 |
  112 |             // Test tap interactions
  113 |             const categoryButton = page.locator('button:has-text("Workshop")');
  114 |             if (await categoryButton.isVisible()) {
  115 |                 await categoryButton.tap();
  116 |                 // Check filter was applied
  117 |                 await page.waitForTimeout(1000);
  118 |             }
  119 |         });
  120 |     });
  121 |
  122 |     test.describe('Form Functionality Across Devices', () => {
  123 |
  124 |         test('should handle search functionality on all devices', async ({ page }) => {
  125 |             await page.goto('/');
  126 |
  127 |             // Test search input
  128 |             const searchInput = page.locator('input[placeholder*="Search events"]');
  129 |             await expect(searchInput).toBeVisible();
  130 |
  131 |             await searchInput.fill('workshop');
  132 |             await page.keyboard.press('Enter');
  133 |
  134 |             // Wait for search results
  135 |             await page.waitForTimeout(2000);
```