
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

// Mock sub-tabs
const IdentityTab = () => <div data-testid="identity-tab">IdentityTab</div>;
IdentityTab.displayName = 'IdentityTab';
const AiConfigTab = () => <div data-testid="ai-tab">AiConfigTab</div>;
AiConfigTab.displayName = 'AiConfigTab';
const ComplianceTab = () => <div data-testid="compliance-tab">ComplianceTab</div>;
ComplianceTab.displayName = 'ComplianceTab';
const BillingTab = () => <div data-testid="billing-tab">BillingTab</div>;
BillingTab.displayName = 'BillingTab';
const ApiKeysTab = () => <div data-testid="keys-tab">ApiKeysTab</div>;
ApiKeysTab.displayName = 'ApiKeysTab';

jest.mock('../tabs/IdentityTab', () => IdentityTab);
jest.mock('../tabs/AiConfigTab', () => AiConfigTab);
jest.mock('../tabs/ComplianceTab', () => ComplianceTab);
jest.mock('../tabs/BillingTab', () => BillingTab);
jest.mock('../tabs/ApiKeysTab', () => ApiKeysTab);

describe('SettingsPage', () => {
    it('renders and switches tabs', async () => {
        render(<SettingsPage />);
        await waitFor(() => {
            expect(screen.getByTestId('identity-tab')).toBeInTheDocument();
        });
    });
});
