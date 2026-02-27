import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsersPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Standardized Amplify mock
const mockGraphql = jest.fn();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graphql: (...args: any[]) => mockGraphql(...args),
    })),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({
        tokens: { idToken: { toString: () => 'test-token' } },
    }),
}));

// Standardized TenantContext mock
jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { plan: 'PRO' },
        loading: false
    }),
}));

describe('UsersPage', () => {
    const mockUsers = [
        { userId: 'u1', email: 'user1@example.com', role: 'ADMIN', status: 'ACTIVE', createdAt: '2024-01-01' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({ data: { listTenantUsers: mockUsers } });
    });

    it('renders correctly', async () => {
        render(<UsersPage />);
        await waitFor(() => {
            expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        });
    });

    it('allows clicking invite user - flexible selector', async () => {
        render(<UsersPage />);
        await waitFor(() => {
            expect(screen.getByText('user1@example.com')).toBeInTheDocument();
        });
        // Search for button that mentions "invite"
        const inviteButton = screen.getByRole('button', { name: /invite/i });
        fireEvent.click(inviteButton);

        // Check for "inviteTitle" or the full key if using simple mock
        await waitFor(() => {
            expect(screen.getByText(/inviteTitle/i)).toBeInTheDocument();
        });
    });
});
