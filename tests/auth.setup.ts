import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Use environment variables or placeholders for now
    const email = process.env.TEST_USER_EMAIL || 'mazinversiones@gmail.com';
    const password = process.env.TEST_USER_PASSWORD || 'Admin.123!';

    await page.goto('/login');

    // Wait for translations to load if necessary
    await page.waitForLoadState('networkidle');

    // Check if already authenticated (redirected away from login)
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
        // Already authenticated, just save state
        await page.context().storageState({ path: authFile });
        return;
    }

    // Fill login form - using more resilient CSS selectors
    await page.locator('input[type="text"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').fill(password);

    await Promise.all([
        // Accept any authenticated route (dashboard, bookings, etc.)
        page.waitForURL(/.*\/(dashboard|bookings|availability|services|providers|rooms|onboarding)/, { timeout: 45000, waitUntil: 'networkidle' }).then(async () => {
            await page.screenshot({ path: 'playwright/debug-login-success.png' });
        }).catch(async (e) => {
            await page.screenshot({ path: 'playwright/debug-login-fail.png' });
            throw e;
        }),
        page.locator('form button[type="submit"]').click()
    ]);

    // Wait for navigation to any authenticated page
    await expect(page).toHaveURL(/.*\/(dashboard|bookings|availability|services|providers|rooms)/, { timeout: 20000 });

    // Check for MUI Drawer (Sidebar) for successful login
    await expect(page.locator('.MuiDrawer-paper')).toBeVisible({ timeout: 20000 });

    // End of setup
    await page.context().storageState({ path: authFile });
});
