import * as React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TenantProvider, useTenant } from '../TenantContext';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

// Mock Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn()
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn(),
    fetchUserAttributes: jest.fn()
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
        (fetchUserAttributes as jest.Mock).mockResolvedValue({
            'custom:tenantId': 't1'
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

        // Wait for data to appear
        await waitFor(() => {
            expect(screen.getByTestId('tenant-name')).toHaveTextContent('Test Tenant');
        }, { timeout: 3000 });

        expect(screen.getByTestId('tenant-plan')).toHaveTextContent('PRO');
        expect(mockGraphql).toHaveBeenCalledWith({
            query: expect.any(String),
            variables: {}, // Verify NO variables are passed
            authMode: 'userPool',
            authToken: 'mock-token'
        });
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

        // Should be empty but not loading
        expect(screen.getByTestId('tenant-name')).toHaveTextContent('');
    });

    it('should handle missing token gracefully', async () => {
        (fetchAuthSession as jest.Mock).mockResolvedValue({
            tokens: {} // No idToken
        });

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
        // Suppress console.error for the expected error
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

        const ComponentWithHook = () => {
            useTenant();
            return null;
        };

        expect(() => render(<ComponentWithHook />)).toThrow();

        consoleError.mockRestore();
    });
});
