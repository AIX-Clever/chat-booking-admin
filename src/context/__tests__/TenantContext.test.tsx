import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantProvider, useTenant } from '../TenantContext';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

// Mock Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn()
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn()
}));

// Test component to consume context
const TestComponent = () => {
    const { tenant, loading } = useTenant();
    if (loading) return <div data-testid="loading">Loading...</div>;
    return (
        <div>
            <div data-testid="tenant-name">{tenant?.name}</div>
            <div data-testid="tenant-plan">{tenant?.plan}</div>
        </div>
    );
};

describe('TenantContext', () => {
    const mockGraphql = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (generateClient as jest.Mock).mockReturnValue({
            graphql: mockGraphql
        });
    });

    it('should fetch and provide tenant data on mount', async () => {
        (fetchAuthSession as jest.Mock).mockResolvedValue({
            tokens: {
                idToken: { toString: () => 'mock-token' }
            }
        });

        mockGraphql.mockResolvedValue({
            data: {
                getTenant: {
                    tenantId: 't1',
                    name: 'Test Tenant',
                    slug: 'test-tenant',
                    plan: 'PRO',
                    status: 'ACTIVE',
                    createdAt: '2023-01-01T00:00:00Z'
                }
            }
        });

        render(
            <TenantProvider>
                <TestComponent />
            </TenantProvider>
        );

        expect(screen.getByTestId('loading')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
        });

        expect(screen.getByTestId('tenant-plan')).toHaveTextContent('PRO');
        expect(mockGraphql).toHaveBeenCalled();
    });

    it('should handle auth session failure gracefully', async () => {
        (fetchAuthSession as jest.Mock).mockRejectedValue(new Error('Auth error'));

        render(
            <TenantProvider>
                <TestComponent />
            </TenantProvider>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        expect(screen.getByTestId('tenant-name')).toHaveTextContent('');
    });

    it('should throw error if useTenant is used outside of TenantProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => render(<TestComponent />)).toThrow('useTenant must be used within a TenantProvider');

        consoleError.mockRestore();
    });
});
