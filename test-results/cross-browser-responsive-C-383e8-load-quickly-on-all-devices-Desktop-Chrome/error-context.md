# Test info

- Name: Cross-Browser Responsive Testing >> Performance Across Devices >> should load quickly on all devices
- Location: /Users/jacksonrhoden/Code/LocalLoop-V0.3/e2e/cross-browser-responsive.spec.ts:199:13

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 10000
Received:   21867
    at /Users/jacksonrhoden/Code/LocalLoop-V0.3/e2e/cross-browser-responsive.spec.ts:208:30
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
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
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
  136 |
  137 |             // Check results are displayed
  138 |             const results = page.locator('text=/workshop/i').first();
  139 |             await expect(results).toBeVisible();
  140 |         });
  141 |
  142 |         test('should handle filter interactions', async ({ page }) => {
  143 |             await page.goto('/');
  144 |
  145 |             // Test category filter
  146 |             const workshopFilter = page.locator('button:has-text("Workshop")');
  147 |             if (await workshopFilter.isVisible()) {
  148 |                 await workshopFilter.click();
  149 |                 await page.waitForTimeout(1000);
  150 |
  151 |                 // Check events are filtered
  152 |                 await expect(page.locator('text=/workshop/i')).toHaveCount({ min: 1 });
  153 |             }
  154 |         });
  155 |     });
  156 |
  157 |     test.describe('Navigation Across Devices', () => {
  158 |
  159 |         test('should navigate correctly between pages', async ({ page }) => {
  160 |             await page.goto('/');
  161 |
  162 |             // Test navigation to different pages
  163 |             const createEventLink = page.locator('a:has-text("Create Event"), a[href*="create"]');
  164 |             if (await createEventLink.isVisible()) {
  165 |                 await createEventLink.click();
  166 |                 await page.waitForLoadState('networkidle');
  167 |
  168 |                 // Check we're on the create event page
  169 |                 await expect(page).toHaveURL(/create/);
  170 |             }
  171 |
  172 |             // Navigate back to home
  173 |             await page.goto('/');
  174 |             await expect(page.locator('h2:has-text("Discover Local Events")')).toBeVisible();
  175 |         });
  176 |
  177 |         test('should handle back/forward navigation', async ({ page }) => {
  178 |             await page.goto('/');
  179 |
  180 |             // Navigate to an event if available
  181 |             const viewDetailsButton = page.locator('button:has-text("View Details")').first();
  182 |             if (await viewDetailsButton.isVisible()) {
  183 |                 await viewDetailsButton.click();
  184 |                 await page.waitForLoadState('networkidle');
  185 |
  186 |                 // Go back
  187 |                 await page.goBack();
  188 |                 await expect(page.locator('h2:has-text("Discover Local Events")')).toBeVisible();
  189 |
  190 |                 // Go forward
  191 |                 await page.goForward();
  192 |                 await page.waitForLoadState('networkidle');
  193 |             }
  194 |         });
  195 |     });
  196 |
  197 |     test.describe('Performance Across Devices', () => {
  198 |
  199 |         test('should load quickly on all devices', async ({ page }) => {
  200 |             const startTime = Date.now();
  201 |
  202 |             await page.goto('/');
  203 |             await page.waitForLoadState('networkidle');
  204 |
  205 |             const loadTime = Date.now() - startTime;
  206 |
  207 |             // Check page loads within reasonable time (10 seconds for safety)
> 208 |             expect(loadTime).toBeLessThan(10000);
      |                              ^ Error: expect(received).toBeLessThan(expected)
  209 |
  210 |             // Check critical elements are visible
  211 |             await expect(page.locator('h1')).toBeVisible();
  212 |             await expect(page.locator('h2')).toBeVisible();
  213 |         });
  214 |     });
  215 |
  216 |     test.describe('Browser-Specific Features', () => {
  217 |
  218 |         test('should handle different browser quirks', async ({ page, browserName }) => {
  219 |             await page.goto('/');
  220 |
  221 |             // Test browser-specific functionality
  222 |             if (browserName === 'webkit') {
  223 |                 // Safari-specific tests
  224 |                 await expect(page.locator('h1')).toBeVisible();
  225 |             } else if (browserName === 'firefox') {
  226 |                 // Firefox-specific tests
  227 |                 await expect(page.locator('h1')).toBeVisible();
  228 |             } else {
  229 |                 // Chrome/Chromium tests
  230 |                 await expect(page.locator('h1')).toBeVisible();
  231 |             }
  232 |
  233 |             // Test common functionality works across all browsers
  234 |             const searchInput = page.locator('input[placeholder*="Search events"]');
  235 |             await expect(searchInput).toBeVisible();
  236 |             await searchInput.fill('test');
  237 |             await expect(searchInput).toHaveValue('test');
  238 |         });
  239 |     });
  240 |
  241 |     test.describe('Accessibility Across Devices', () => {
  242 |
  243 |         test('should maintain accessibility standards', async ({ page }) => {
  244 |             await page.goto('/');
  245 |
  246 |             // Check for proper heading hierarchy
  247 |             const h1 = page.locator('h1');
  248 |             await expect(h1).toBeVisible();
  249 |
  250 |             // Check for proper form labels
  251 |             const searchInput = page.locator('input[placeholder*="Search events"]');
  252 |             await expect(searchInput).toBeVisible();
  253 |
  254 |             // Test keyboard navigation
  255 |             await page.keyboard.press('Tab');
  256 |             await page.keyboard.press('Tab');
  257 |
  258 |             // Check focus is visible
  259 |             const focusedElement = page.locator(':focus');
  260 |             await expect(focusedElement).toBeVisible();
  261 |         });
  262 |     });
  263 | });
  264 |
  265 | // Device-specific test suites (devices configured in playwright.config.ts)
  266 | test.describe('Mobile Device Testing', () => {
  267 |
  268 |     test('should work correctly on mobile devices', async ({ page }) => {
  269 |         await page.goto('/');
  270 |
  271 |         // Get viewport info to determine device type
  272 |         const viewportSize = page.viewportSize();
  273 |         const isMobile = viewportSize && viewportSize.width < 768;
  274 |
  275 |         // Mobile-specific assertions
  276 |         await expect(page.locator('h1')).toBeVisible();
  277 |
  278 |         if (isMobile) {
  279 |             // Test mobile-specific features
  280 |             console.log(`Testing mobile device: ${viewportSize.width}x${viewportSize.height}`);
  281 |
  282 |             // Check that elements are properly sized for mobile
  283 |             const mainContent = page.locator('main');
  284 |             await expect(mainContent).toBeVisible();
  285 |         } else {
  286 |             // Desktop/tablet testing
  287 |             console.log(`Testing larger device: ${viewportSize?.width}x${viewportSize?.height}`);
  288 |         }
  289 |     });
  290 | });
  291 |
  292 | test.describe('Desktop Browser Comparisons', () => {
  293 |
  294 |     ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
  295 |         test(`should render consistently in ${browserName}`, async ({ page }) => {
  296 |             await page.goto('/');
  297 |
  298 |             // Cross-browser consistency checks
  299 |             await expect(page.locator('h1')).toBeVisible();
  300 |             await expect(page.locator('h2')).toBeVisible();
  301 |
  302 |             // Take browser-specific screenshot
  303 |             await expect(page).toHaveScreenshot(`${browserName}-consistency.png`);
  304 |         });
  305 |     });
  306 | }); 
```