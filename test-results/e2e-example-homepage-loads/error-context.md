# Test info

- Name: homepage loads
- Location: /Users/jacksonrhoden/Code/LocalLoop-V0.3/e2e/example.spec.ts:2:5

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/jacksonrhoden/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
> 2 | test('homepage loads', async ({ page }) => {
    |     ^ Error: browserType.launch: Executable doesn't exist at /Users/jacksonrhoden/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell
  3 |   await page.goto('http://localhost:3000');
  4 |   await expect(page.locator('body')).toBeVisible();
  5 | });
  6 |
```