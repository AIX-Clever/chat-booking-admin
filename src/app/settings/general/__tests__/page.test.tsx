
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GeneralSettingsPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock TenantContext
jest.mock('../../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1', name: 'Test Tenant', slug: 'test-slug' },
        loading: false,
        updateTenant: jest.fn(),
    }),
}));

describe('GeneralSettingsPage', () => {
    it('renders correctly', async () => {
        render(<GeneralSettingsPage />);
        await waitFor(() => {
            expect(screen.queryByRole('textbox') || screen.queryByText(/./)).not.toBeNull();
        });
    });
});
