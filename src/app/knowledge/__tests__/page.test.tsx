
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import KnowledgePage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock PlanGuard
jest.mock('../../../components/PlanGuard', () => function MockPlanGuard({ children }: { children: React.ReactNode }) { return <div data-testid="plan-guard-outer">{children}</div>; });

// Mock queries
jest.mock('../../../graphql/queries', () => ({
    GET_TENANT: 'query GetTenant { getTenant { id settings } }',
}));

// Mock Amplify
const mockGraphql = jest.fn();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: (...args: unknown[]) => mockGraphql(...args),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({
        tokens: { idToken: { toString: () => 'token' } }
    }),
}));

describe('KnowledgePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({
            data: {
                getTenant: { id: 't1', settings: JSON.stringify({ ai: { enabled: true } }) }
            }
        });
    });

    it('renders correctly', async () => {
        render(<KnowledgePage />);
        await waitFor(() => {
            expect(screen.queryByTestId('plan-guard-outer')).not.toBeNull();
            expect(screen.queryByText('title')).not.toBeNull();
        }, { timeout: 3000 });
    });
});
