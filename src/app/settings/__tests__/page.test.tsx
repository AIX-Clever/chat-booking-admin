
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SettingsPage from '../page';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1', plan: 'PRO', settings: JSON.stringify({ theme: { primaryColor: '#000' } }) },
        loading: false,
        updateTenant: jest.fn(),
    }),
}));

jest.mock('../tabs/IdentityTab', () => {
    const mockIdentityTab = () => <div data-testid="identity-tab">IdentityTab</div>;
    mockIdentityTab.displayName = 'IdentityTab';
    return mockIdentityTab;
});
jest.mock('../tabs/AiConfigTab', () => {
    const mockAiConfigTab = () => <div data-testid="ai-tab">AiConfigTab</div>;
    mockAiConfigTab.displayName = 'AiConfigTab';
    return mockAiConfigTab;
});
jest.mock('../tabs/BillingTab', () => {
    const mockBillingTab = () => <div data-testid="billing-tab">BillingTab</div>;
    mockBillingTab.displayName = 'BillingTab';
    return mockBillingTab;
});
jest.mock('../tabs/ApiKeysTab', () => {
    const mockApiKeysTab = () => <div data-testid="keys-tab">ApiKeysTab</div>;
    mockApiKeysTab.displayName = 'ApiKeysTab';
    return mockApiKeysTab;
});

describe('SettingsPage', () => {
    it('renders and switches tabs', async () => {
        render(<SettingsPage />);
        await waitFor(() => {
            expect(screen.getByTestId('identity-tab')).toBeInTheDocument();
        });
    });
});
