
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AlertsPage from '../AlertsPage';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock TenantContext
jest.mock('../../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1', settings: JSON.stringify({ notifications: { email: true } }) },
        loading: false,
        updateTenant: jest.fn(),
    }),
}));

describe('AlertsPage', () => {
    it('renders correctly', async () => {
        render(<AlertsPage />);
        await waitFor(() => {
            expect(screen.queryByText(/./)).not.toBeNull();
        });
    });
});
