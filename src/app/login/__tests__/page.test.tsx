
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
}));

describe('LoginPage', () => {
    it('renders correctly', async () => {
        render(<LoginPage />);
        await waitFor(() => {
            // LoginPage usually has a "password" field or a button
            expect(screen.queryByRole('button') || screen.queryByRole('textbox') || screen.queryByLabelText(/password/i)).not.toBeNull();
        }, { timeout: 10000 });
    }, 15000);
});
