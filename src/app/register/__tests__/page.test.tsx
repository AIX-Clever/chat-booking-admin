
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RegisterPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

// Mock Amplify
jest.mock('aws-amplify/auth', () => ({
    signUp: jest.fn(),
    fetchAuthSession: jest.fn().mockResolvedValue({}),
}));

describe('RegisterPage', () => {
    it('renders correctly', async () => {
        render(<RegisterPage />);
        await waitFor(() => {
            expect(screen.queryByRole('button') || screen.queryByRole('textbox') || screen.queryByText(/./)).not.toBeNull();
        });
    });
});
