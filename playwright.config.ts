import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html'],
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/results.xml' }]
    ],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',

        /* Take screenshot on failure */
        screenshot: 'only-on-failure',

        /* Record video on failure */
        video: 'retain-on-failure',

        /* Enhanced for visual testing */
        ignoreHTTPSErrors: true,
        actionTimeout: 10000,
        navigationTimeout: 30000,
    },

    /* Configure projects - CI-optimized vs Full Local Testing */
    projects: process.env.CI ? [
        // CI: Minimal, fast, essential coverage only
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ] : [
        // LOCAL: Full comprehensive testing across all devices and browsers

        // Desktop Browsers - Primary Testing
        {
            name: 'Desktop Chrome',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        {
            name: 'Desktop Firefox',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        {
            name: 'Desktop Safari',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1920, height: 1080 }
            },
        },
        {
            name: 'Desktop Edge',
            use: {
                ...devices['Desktop Edge'],
                channel: 'msedge',
                viewport: { width: 1920, height: 1080 }
            },
        },

        // Responsive Desktop Breakpoints
        {
            name: 'Desktop Medium (1280px)',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'Desktop Small (1024px)',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1024, height: 768 }
            },
        },

        // Tablet Testing
        {
            name: 'iPad',
            use: { ...devices['iPad'] },
        },
        {
            name: 'iPad Pro',
            use: { ...devices['iPad Pro'] },
        },
        {
            name: 'iPad Mini',
            use: { ...devices['iPad Mini'] },
        },
        {
            name: 'Galaxy Tab S4',
            use: { ...devices['Galaxy Tab S4'] },
        },

        // Mobile Devices - iOS
        {
            name: 'iPhone 14',
            use: { ...devices['iPhone 14'] },
        },
        {
            name: 'iPhone 14 Pro',
            use: { ...devices['iPhone 14 Pro'] },
        },
        {
            name: 'iPhone 13',
            use: { ...devices['iPhone 13'] },
        },
        {
            name: 'iPhone 12',
            use: { ...devices['iPhone 12'] },
        },
        {
            name: 'iPhone SE',
            use: { ...devices['iPhone SE'] },
        },

        // Mobile Devices - Android
        {
            name: 'Pixel 7',
            use: { ...devices['Pixel 7'] },
        },
        {
            name: 'Pixel 5',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Galaxy S9+',
            use: { ...devices['Galaxy S9+'] },
        },
        {
            name: 'Galaxy Note II',
            use: { ...devices['Galaxy Note II'] },
        },

        // Custom Responsive Breakpoints
        {
            name: 'Mobile Large (414px)',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 414, height: 896 },
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'Mobile Medium (375px)',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 375, height: 667 },
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'Mobile Small (320px)',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 320, height: 568 },
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
            },
        },

        // Browser-specific configurations for edge cases
        {
            name: 'Chrome Headless',
            use: {
                ...devices['Desktop Chrome'],
                headless: true,
                viewport: { width: 1280, height: 720 }
            },
        },
        {
            name: 'Firefox Headless',
            use: {
                ...devices['Desktop Firefox'],
                headless: true,
                viewport: { width: 1280, height: 720 }
            },
        },

        // High DPI Testing
        {
            name: 'High DPI',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1920, height: 1080 },
                deviceScaleFactor: 2,
            },
        },
    ],

    /* Global setup and teardown */
    globalSetup: require.resolve('./e2e/global-setup.ts'),
    globalTeardown: require.resolve('./e2e/global-teardown.ts'),

    /* Run your local dev server before starting the tests */
    webServer: {
        command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },

    /* Test timeout */
    timeout: 60 * 1000, // 60 seconds for cross-browser testing

    /* Expect timeout */
    expect: {
        timeout: 10 * 1000, // 10 seconds for assertions
        // Enable visual comparisons
        toHaveScreenshot: { threshold: 0.2 },
        toMatchSnapshot: { threshold: 0.2 },
    },
}); 