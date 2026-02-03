import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
    const menus = [
        { label: 'Dashboard', url: '/dashboard', title: 'Dashboard' },
        { label: 'Reservas', url: '/bookings', title: 'Reservas' },
        { label: 'Disponibilidad', url: '/availability', title: 'Disponibilidad' },
        { label: 'Salas', url: '/rooms', title: 'Salas' },
        { label: 'Servicios', url: '/services', title: 'Servicios' },
        { label: 'Profesionales', url: '/providers', title: 'Profesionales' },
    ];

    for (const menu of menus) {
        test(`should navigate to ${menu.label}`, async ({ page }) => {
            await page.goto('/'); // Should redirect to dashboard if authenticated

            // Click sidebar link - using ultra-resilient href locator
            await page.locator(`a[href="${menu.url}"]`).click();

            // Verify URL
            await expect(page).toHaveURL(new RegExp(menu.url));

            // Verify Title/Heading - target the AppBar specifically. 
            // The header uses multiple nested elements for Title and Subtitle (Tenant), 
            // so we check if the main title is present anywhere in the header.
            await expect(page.locator('header')).toContainText(menu.title, { timeout: 15000 });
        });
    }
});
