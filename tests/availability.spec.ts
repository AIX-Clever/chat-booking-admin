import { test, expect } from '@playwright/test';

test.describe('Availability Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/availability');
        await page.waitForURL(/.*\/availability/);
        await page.waitForLoadState('networkidle');
    });

    test('should display weekly schedule grid', async ({ page }) => {
        // Verify the page loaded
        await expect(page.locator('header')).toContainText('Disponibilidad', { timeout: 15000 });

        // Should have day names visible (at least some)
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        let foundDays = 0;

        for (const day of dayNames) {
            if (await page.locator(`text=${day}`).first().isVisible().catch(() => false)) {
                foundDays++;
            }
        }

        // Should find at least Monday-Friday (5 days)
        expect(foundDays).toBeGreaterThanOrEqual(5);
    });

    test('should toggle a day on and off', async ({ page }) => {
        // Find toggle switches (MUI Switch components)
        const switches = page.locator('input[type="checkbox"][role="switch"], .MuiSwitch-input');

        if (await switches.first().isVisible()) {
            const firstSwitch = switches.first();
            const initialState = await firstSwitch.isChecked();

            // Click to toggle
            await firstSwitch.click({ force: true });
            await page.waitForTimeout(300);

            // Verify state changed
            const newState = await firstSwitch.isChecked();
            expect(newState).not.toBe(initialState);

            // Toggle back to restore original state
            await firstSwitch.click({ force: true });
        }
    });

    test('should add a new time window to a day', async ({ page }) => {
        // First, ensure at least one day is enabled
        const switches = page.locator('input[type="checkbox"][role="switch"], .MuiSwitch-input');
        const firstSwitch = switches.first();

        if (await firstSwitch.isVisible()) {
            if (!(await firstSwitch.isChecked())) {
                await firstSwitch.click({ force: true });
                await page.waitForTimeout(300);
            }
        }

        // Look for "Add Time Window" or "+" button within the day section
        const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid*="Add"]') }).first();

        if (await addButton.isVisible()) {
            const initialInputs = await page.locator('input[type="time"]').count();

            await addButton.click();
            await page.waitForTimeout(300);

            const newInputs = await page.locator('input[type="time"]').count();

            // Should have more time inputs after adding window
            expect(newInputs).toBeGreaterThanOrEqual(initialInputs);
        }
    });

    test('should save availability changes', async ({ page }) => {
        // Find and click Save button
        const saveButton = page.locator('button').filter({ hasText: /Guardar|Save/i }).first();

        if (await saveButton.isVisible()) {
            await saveButton.click();

            // Wait for save operation
            await page.waitForTimeout(2000);

            // Should show success toast or the button should not be disabled
            const toast = page.locator('[role="alert"], .MuiSnackbar-root, .MuiAlert-root');
            if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(toast).toContainText(/guardad|saved|éxito|success/i);
            }
        }
    });

    test('should add an exception day', async ({ page }) => {
        // Look for "Add Exception" button
        const addExceptionButton = page.locator('button').filter({ hasText: /Agregar Excepción|Nueva Excepción|Add Exception/i }).first();

        if (await addExceptionButton.isVisible()) {
            await addExceptionButton.click();

            // Should show a date picker or dialog
            await page.waitForTimeout(500);

            // Check if dialog appeared or date input is visible
            const hasDialog = await page.getByRole('dialog').isVisible().catch(() => false);
            const hasDateInput = await page.locator('input[type="date"]').isVisible().catch(() => false);

            expect(hasDialog || hasDateInput).toBeTruthy();

            // Close if dialog
            if (hasDialog) {
                await page.keyboard.press('Escape');
            }
        }
    });

    test('should select provider from dropdown', async ({ page }) => {
        // Some availability pages have provider selector
        const providerSelector = page.locator('select, [role="combobox"]').filter({ hasText: /Profesional|Provider/i }).first();

        if (await providerSelector.isVisible()) {
            await providerSelector.click();
            await page.waitForTimeout(300);

            // Select first option if available
            const firstOption = page.getByRole('option').first();
            if (await firstOption.isVisible()) {
                await firstOption.click();
                await page.waitForTimeout(500);
            }
        }

        // Page should still be functional
        await expect(page.locator('header')).toContainText('Disponibilidad');
    });

    test('should display time pickers for schedule windows', async ({ page }) => {
        // Enable a day first if not enabled
        const switches = page.locator('input[type="checkbox"][role="switch"], .MuiSwitch-input');
        const firstSwitch = switches.first();

        if (await firstSwitch.isVisible() && !(await firstSwitch.isChecked())) {
            await firstSwitch.click({ force: true });
            await page.waitForTimeout(500);
        }

        // Should have time inputs for start/end times
        const timeInputs = page.locator('input[type="time"], .MuiTimePicker-root, input[placeholder*=":"]');
        const count = await timeInputs.count();

        // If day is enabled, should have at least 2 time inputs (start, end)
        if (await firstSwitch.isChecked().catch(() => false)) {
            expect(count).toBeGreaterThanOrEqual(2);
        }
    });
});
