import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TenantProvider, useTenant } from '../TenantContext';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';

// Mock Amplify
jest.mock('aws-amplify/auth');
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn()
    }))
}));
jest.mock('aws-amplify/utils');

const TestComponent = () => {
    const { tenant, loading } = useTenant();
    if (loading) return <div data-testid="loading">Loading...</div>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <div data-testid="tenant-display">{tenant ? (tenant as any).name : 'No Tenant'}</div>;
};
TestComponent.displayName = 'TestComponent';

describe('TenantContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('loads tenant data on mount', async () => {
        (fetchAuthSession as jest.Mock).mockResolvedValue({
            tokens: { idToken: { toString: () => 'valid-token' } }
        });
        (fetchUserAttributes as jest.Mock).mockResolvedValue({});

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockGraphql = (generateClient() as any).graphql;
        mockGraphql.mockResolvedValue({
            data: { getTenant: { tenantId: 't1', name: 'Test Tenant', slug: 'test' } }
        });

        render(
            <TenantProvider>
                <TestComponent />
            </TenantProvider>
        );

        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        }, { timeout: 10000 });

        expect(screen.getByTestId('tenant-display')).toHaveTextContent('Test Tenant');
    }, 15000);

    it('handles auth events', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let authCallback: any = null;
        (Hub.listen as jest.Mock).mockImplementation((channel, callback) => {
            if (channel === 'auth') authCallback = callback;
            return jest.fn();
        });

        (fetchAuthSession as jest.Mock).mockResolvedValue({
            tokens: { idToken: { toString: () => 'valid-token' } }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockGraphql = (generateClient() as any).graphql;
        mockGraphql.mockResolvedValue({
            data: { getTenant: { tenantId: 't1', name: 'Auth Tenant' } }
        });

        render(
            <TenantProvider>
                <TestComponent />
            </TenantProvider>
        );

        await waitFor(() => expect(screen.queryByTestId('loading')).not.toBeInTheDocument());

        // Trigger signedIn event
        if (authCallback) {
            await waitFor(async () => {
                await authCallback({ payload: { event: 'signedIn' } });
            });
        }

        await waitFor(() => expect(screen.getByTestId('tenant-display')).toHaveTextContent('Auth Tenant'), { timeout: 10000 });

        // Trigger signedOut event
        if (authCallback) {
            await waitFor(async () => {
                await authCallback({ payload: { event: 'signedOut' } });
            });
        }

        await waitFor(() => expect(screen.getByTestId('tenant-display')).toHaveTextContent('No Tenant'), { timeout: 10000 });
    }, 20000);
});
