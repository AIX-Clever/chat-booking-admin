
import React from 'react';
import { render, screen } from '@testing-library/react';
import WebIntegrationPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

jest.mock('../../../../components/PlanGuard', () => {
    const mockPlanGuard = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
    mockPlanGuard.displayName = 'PlanGuard';
    return mockPlanGuard;
});

// Mock TenantContext
jest.mock('../../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1', slug: 'tenant1', tenantId: 'tid1', settings: JSON.stringify({ ai: { enabled: true } }) },
        refreshTenant: jest.fn(),
    }),
}));

// Mock Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn().mockResolvedValue({ data: { getTenant: { id: 't1', settings: '{}' } } }),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({ tokens: { idToken: { toString: () => 'token' } } }),
}));

// Mock WidgetCustomizer
jest.mock('../components/WidgetCustomizer', () => {
    const mockWidgetCustomizer = () => <div data-testid="widget-customizer">WidgetCustomizer</div>;
    mockWidgetCustomizer.displayName = 'WidgetCustomizer';
    return mockWidgetCustomizer;
});

describe('WebIntegrationPage', () => {
    it('renders correctly', async () => {
        render(<WebIntegrationPage />);
        expect(await screen.findByText('title')).toBeInTheDocument();
        expect(screen.getByText(/chat/i)).toBeInTheDocument();
    });
});
