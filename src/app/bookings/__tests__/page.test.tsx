
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import BookingsPage from '../page';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'es',
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { tenantId: 't1' },
        loading: false
    }),
}));

// Mock amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn().mockResolvedValue({
            data: {
                listProviders: [],
                listRooms: { listRooms: [] },
                searchServices: []
            }
        }),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({}),
}));

describe('BookingsPage', () => {
    it('renders correctly', async () => {
        render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <BookingsPage />
            </LocalizationProvider>
        );
        await waitFor(() => {
            expect(document.body.innerHTML.length).toBeGreaterThan(100);
        }, { timeout: 10000 });
    }, 20000);
});
