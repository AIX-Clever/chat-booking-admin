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

    // Fill login form - using more resilient CSS selectors
    await page.locator('input[type="text"], input[name="email"]').first().fill(email);
    await page.locator('input[type="password"]').fill(password);

    await Promise.all([
        page.waitForURL(/.*dashboard/, { timeout: 30000 }),
        page.locator('form button[type="submit"]').click()
    ]);

    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 20000 });

    // Check for MUI Drawer (Sidebar) or header title for successful login
    await expect(page.locator('.MuiDrawer-paper')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('header')).toContainText(/Dashboard/i, { timeout: 15000 });

    // End of setup
    await page.context().storageState({ path: authFile });
});
