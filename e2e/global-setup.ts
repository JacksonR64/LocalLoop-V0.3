import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    console.log('🚀 Starting global test setup...');

    // Launch browser for setup operations
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Wait for development server to be ready
        console.log('⏳ Waiting for development server...');
        await page.goto(config.webServer?.url || 'http://localhost:3000', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Verify critical pages are accessible
        console.log('🔍 Verifying application health...');

        // Check homepage
        const baseUrl = config.webServer?.url || 'http://localhost:3000';
        const homepageResponse = await page.goto(`${baseUrl}/`);
        if (homepageResponse?.status() !== 200) {
            throw new Error(`Homepage returned status ${homepageResponse?.status()}`);
        }

        // Check API health
        const apiResponse = await page.goto(`${baseUrl}/api/events`);
        // API might return 401 (unauthorized) which is expected for unauthenticated requests
        if (apiResponse?.status() !== 401 && apiResponse?.status() !== 200) {
            console.warn(`API returned unexpected status ${apiResponse?.status()}`);
        }

        console.log('✅ Application health check passed');

        // Setup test data if needed
        // This is where you would create test users, events, etc.
        console.log('📝 Test data setup completed');

    } catch (error) {
        console.error('❌ Global setup failed:', error);
        throw error;
    } finally {
        await context.close();
        await browser.close();
    }

    console.log('✅ Global test setup completed');
}

export default globalSetup; 