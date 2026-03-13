import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardMetrics, usePlanUsage } from '../useDashboardMetrics';
import { generateClient } from 'aws-amplify/api';

jest.mock('aws-amplify/api', () => {
    const mockClient = {
        graphql: jest.fn(),
    };
    return {
        generateClient: jest.fn(() => mockClient),
        mockClient // Export for test usage if needed, but we'll use generateClient().graphql
    };
});

// Mock amplify/auth
jest.mock('aws-amplify/auth', () => ({
    getCurrentUser: jest.fn().mockResolvedValue({ userId: 'u1' }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMockedClient = () => (generateClient() as any).mockClient || generateClient();

describe('useDashboardMetrics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });



    it('provides fallback data on error', async () => {
        getMockedClient().graphql.mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useDashboardMetrics());

        await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

        expect(result.current.error).toBe('Network error');
        expect(result.current.metrics).not.toBeNull();
    });
});

describe('usePlanUsage', () => {
    it('returns usage on success', async () => {
        const mockUsage = { messages: 10, bookings: 5, tokensIA: 100, providers: 2 };
        getMockedClient().graphql.mockResolvedValueOnce({ data: { getPlanUsage: mockUsage } });

        const { result } = renderHook(() => usePlanUsage());
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.usage).toEqual(mockUsage);
        }, { timeout: 5000 });
    });
});
