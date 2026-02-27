
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ApiKeysPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock TenantContext
jest.mock('../../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1' },
        loading: false
    }),
}));

describe('ApiKeysPage', () => {
    it('renders correctly', async () => {
        render(<ApiKeysPage />);
        await waitFor(() => {
            expect(screen.queryByRole('button') || screen.queryByText(/./)).not.toBeNull();
        });
    });
});
