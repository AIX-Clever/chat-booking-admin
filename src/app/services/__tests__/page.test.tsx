
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import ServicesPage from '../page';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'es',
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1' },
        loading: false
    }),
}));

jest.mock('../../../components/common/ToastContext', () => ({
    useToast: () => ({ showToast: jest.fn() }),
}));

jest.mock('../../../components/common/ConfirmDialog', () => {
    const mockConfirmDialog = () => <div data-testid="confirm-dialog">ConfirmDialog</div>;
    mockConfirmDialog.displayName = 'ConfirmDialog';
    return mockConfirmDialog;
});

// Mock amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn().mockResolvedValue({
            data: {
                searchServices: [],
                listCategories: [],
                listRooms: []
            }
        }),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({}),
}));

describe('ServicesPage', () => {
    it('renders correctly', async () => {
        render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <ServicesPage />
            </LocalizationProvider>
        );
        await waitFor(() => {
            expect(document.body.innerHTML.length).toBeGreaterThan(100);
        }, { timeout: 10000 });
    }, 20000);
});
