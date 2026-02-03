import { test, expect } from '@playwright/test';

test.describe('Admin CRUD Operations', () => {

    test('should create, list, and delete a Room', async ({ page }) => {
        await page.goto('/rooms');
        await page.waitForURL(/.*\/rooms/);

        const testRoomName = `Test Room ${Date.now()}`;

        // 1. Create
        await page.locator('button:has-text("Nueva Sala")').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.getByLabel(/Nombre/i).fill(testRoomName);
        await page.getByLabel(/Descripción/i).fill('This is a test room created by Playwright');
        await page.getByRole('button', { name: /Guardar/i }).click();

        // 2. Verify in list
        await expect(page.locator('table')).toContainText(testRoomName, { timeout: 15000 });

        // 3. Cleanup (Delete)
        const row = page.locator('tr').filter({ hasText: testRoomName });
        await row.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).click();

        // Confirm delete in dialog
        await page.getByRole('button', { name: /Eliminar|Delete/i }).click();

        // 4. Verify removal
        await expect(page.locator('table')).not.toContainText(testRoomName, { timeout: 15000 });
    });

    test('should create, list, and delete a Service', async ({ page }) => {
        await page.goto('/services', { waitUntil: 'networkidle' });

        const testCatName = `Cat ${Date.now()}`;
        const testServiceName = `Service ${Date.now()}`;

        // 1. Create Category first
        await page.locator('button:has-text("Categoría")').click();
        await page.getByPlaceholder(/Nombre de nueva categoría/i).fill(testCatName);
        await page.getByRole('button', { name: /Agregar/i }).click();
        await page.waitForTimeout(1000);
        // Resilient close
        await page.locator('button:has-text("Cerrar")').first().click().catch(() => { });

        // 2. Create Service
        await page.locator('button:has-text("Agregar Servicio")').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.getByLabel(/Nombre del Servicio/i).fill(testServiceName);
        await page.getByLabel(/Descripción/i).fill('Test description');
        await page.getByLabel(/Duración/i).fill('45');
        await page.getByLabel(/Precio/i).fill('5000');

        // Category selection
        await page.getByLabel(/Categoría/i).click();
        await page.getByRole('option', { name: testCatName }).click();

        await page.getByRole('button', { name: /Guardar/i }).click();

        // 3. Verify in list
        await expect(page.locator('table')).toContainText(testServiceName, { timeout: 15000 });

        // 4. Cleanup Service
        const serviceRow = page.locator('tr').filter({ hasText: testServiceName });
        await serviceRow.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).click();
        await page.getByRole('button', { name: /Eliminar|Delete/i }).click();

        // 5. Cleanup Category (Best-effort)
        try {
            await page.locator('button:has-text("Categoría")').click();
            await page.locator('li').filter({ hasText: testCatName }).locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).click();
            await page.waitForTimeout(500);
            await page.locator('button:has-text("Cerrar")').first().click().catch(() => { });
        } catch (e) {
            console.log('Cleanup category failed (non-critical):', e.message);
        }

        // 6. Verify removal
        await expect(page.locator('table')).not.toContainText(testServiceName, { timeout: 15000 });
    });

    test('should create, list, and delete a Provider', async ({ page }) => {
        await page.goto('/services', { waitUntil: 'networkidle' });
        const testProviderName = `Provider ${Date.now()}`;
        const providerService = `SvcForPro ${Date.now()}`;
        const providerCat = `CatForPro ${Date.now()}`;

        // Create Cat and Svc
        await page.locator('button:has-text("Categoría")').click();
        await page.getByPlaceholder(/Nombre de nueva categoría/i).fill(providerCat);
        await page.getByRole('button', { name: /Agregar/i }).click();
        await page.waitForTimeout(500);
        await page.locator('button:has-text("Cerrar")').first().click().catch(() => { });

        await page.locator('button:has-text("Agregar Servicio")').first().click();
        await page.getByLabel(/Nombre del Servicio/i).fill(providerService);
        await page.getByLabel(/Duración/i).fill('30');
        await page.getByLabel(/Precio/i).fill('100');
        await page.getByLabel(/Categoría/i).click();
        await page.getByRole('option', { name: providerCat }).click();
        await page.getByRole('button', { name: /Guardar/i }).click();
        await expect(page.locator('table')).toContainText(providerService);

        // NOW CREATE PROVIDER
        await page.goto('/providers');
        await page.waitForURL(/.*\/providers/);

        await page.locator('button:has-text("Nuevo Profesional")').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Tab 1: General
        await page.getByLabel(/Nombre Completo/i).fill(testProviderName);

        // Tab 2: Servicios
        await page.getByRole('tab', { name: /Servicios/i }).click();
        await page.getByLabel(/Servicios Asignados/i).click();
        await page.getByRole('option', { name: providerService }).click();
        await page.keyboard.press('Escape');

        // Save
        await page.getByRole('button', { name: /Guardar/i }).click();

        // 2. Verify in list
        await expect(page.locator('table')).toContainText(testProviderName, { timeout: 15000 });

        // 3. Cleanup (Delete)
        const row = page.locator('tr').filter({ hasText: testProviderName });
        await row.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') }).click();
        await page.getByRole('button', { name: /Eliminar|Delete/i }).click();

        // 4. Verify removal
        await expect(page.locator('table')).not.toContainText(testProviderName, { timeout: 15000 });
    });
});
