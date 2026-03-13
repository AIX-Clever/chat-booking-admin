
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    useSearchParams: () => ({ get: jest.fn() }),
}));

// Mock Amplify
jest.mock('aws-amplify/auth', () => ({
    signIn: jest.fn(),
    fetchAuthSession: jest.fn().mockResolvedValue({}),
    getCurrentUser: jest.fn().mockRejectedValue(new Error('No user')),
}));

describe('LoginPage', () => {
    it('renders correctly', async () => {
        render(<LoginPage />);
        // Use more stable data-testids
        await waitFor(() => {
            expect(screen.getByTestId('email-input')).toBeInTheDocument();
            expect(screen.getByTestId('password-input')).toBeInTheDocument();
        }, { timeout: 10000 });
    }, 15000);
});
