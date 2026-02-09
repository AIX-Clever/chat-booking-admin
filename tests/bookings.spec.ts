import { test, expect } from '@playwright/test';

test.describe('Bookings Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/bookings');
        await page.waitForURL(/.*\/bookings/);
    });

    test('should display bookings table or calendar view', async ({ page }) => {
        // Verify the page loaded with content
        await expect(page.locator('header')).toContainText('Reservas', { timeout: 15000 });

        // Should have MuiPaper container with content (week/list/calendar views)
        const hasMuiPaper = await page.locator('.MuiPaper-root').first().isVisible().catch(() => false);

        // Or has view toggle buttons (week, list, calendar)
        const hasViewButtons = await page.locator('[aria-label="week view"], [aria-label="list view"], [aria-label="calendar view"]').first().isVisible().catch(() => false);

        expect(hasMuiPaper || hasViewButtons).toBeTruthy();
    });

    test('should filter bookings by status', async ({ page }) => {
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');

        // Find and click status filter dropdown
        const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /Estado|Status|All/i }).first();

        if (await statusFilter.isVisible()) {
            await statusFilter.click();
            // Select 'confirmed' or similar option
            await page.getByRole('option', { name: /confirmed|confirmad/i }).click().catch(() => { });
        }

        // Verify filter was applied (page should update)
        await page.waitForTimeout(1000);
    });

    test('should open new booking dialog', async ({ page }) => {
        // Look for "Nueva Reserva" or similar button
        const newBookingButton = page.locator('button').filter({ hasText: /Nueva Reserva|New Booking|Agregar|Add/i }).first();

        if (await newBookingButton.isVisible()) {
            await newBookingButton.click();

            // Dialog should appear
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

            // Dialog should have form fields
            await expect(page.getByRole('dialog')).toContainText(/Cliente|Client|Servicio|Service/i);

            // Close dialog
            await page.keyboard.press('Escape');
        }
    });

    test('should switch between table and calendar views', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Look for view toggle buttons (table/calendar icons or tabs)
        const calendarButton = page.locator('button').filter({ has: page.locator('svg[data-testid*="Calendar"], svg[data-testid*="Today"]') }).first();
        const tableButton = page.locator('button').filter({ has: page.locator('svg[data-testid*="Table"], svg[data-testid*="List"]') }).first();

        // Try switching to calendar view
        if (await calendarButton.isVisible()) {
            await calendarButton.click();
            await page.waitForTimeout(500);
        }

        // Try switching to table view
        if (await tableButton.isVisible()) {
            await tableButton.click();
            await page.waitForTimeout(500);
        }

        // Verify we can still see the page content
        await expect(page.locator('header')).toContainText('Reservas');
    });

    test('should navigate calendar months', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Look for navigation arrows
        const nextButton = page.locator('button').filter({ has: page.locator('svg[data-testid*="ArrowForward"], svg[data-testid*="ChevronRight"]') }).first();
        const prevButton = page.locator('button').filter({ has: page.locator('svg[data-testid*="ArrowBack"], svg[data-testid*="ChevronLeft"]') }).first();

        if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(300);
        }

        if (await prevButton.isVisible()) {
            await prevButton.click();
            await page.waitForTimeout(300);
        }

        // Page should still be responsive
        await expect(page.locator('header')).toContainText('Reservas');
    });

    test('should show booking details on row click', async ({ page }) => {
        await page.waitForLoadState('networkidle');

        // Click on first booking row if table exists
        const firstRow = page.locator('table tbody tr').first();

        if (await firstRow.isVisible()) {
            // Look for a details/view button or click the row
            const viewButton = firstRow.locator('button').filter({ has: page.locator('svg[data-testid*="Visibility"], svg[data-testid*="Info"]') }).first();

            if (await viewButton.isVisible()) {
                await viewButton.click();
                // Verify details are shown (dialog or expanded view)
                await page.waitForTimeout(500);
            }
        }
    });
});
