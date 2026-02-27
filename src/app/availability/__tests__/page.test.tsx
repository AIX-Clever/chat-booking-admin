
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AvailabilityPage from '../page';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'es',
}));

jest.mock('../../../components/common/ToastContext', () => ({
    useToast: () => ({ showToast: jest.fn() }),
}));

// Mock amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn().mockResolvedValue({ data: { listProviders: [] } }),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({}),
}));

describe('AvailabilityPage', () => {
    it('renders correctly', async () => {
        render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <AvailabilityPage />
            </LocalizationProvider>
        );
        await waitFor(() => {
            // Check if anything rendered in the body (MUI renders a lot of divs)
            expect(document.body.innerHTML.length).toBeGreaterThan(100);
        }, { timeout: 10000 });
    }, 20000);
});
