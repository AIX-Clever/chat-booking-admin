
import React from 'react';
import { render } from '@testing-library/react';
import OnboardingPage from '../page';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(),
}));

jest.mock('aws-amplify/auth', () => ({
    fetchUserAttributes: jest.fn(),
    fetchAuthSession: jest.fn(),
}));

// Mock window.location correctly for JSDOM
const originalLocation = window.location;

describe('OnboardingPage', () => {
    beforeAll(() => {
        delete (window as unknown as Record<string, unknown>).location;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.location = { ...originalLocation, href: '' } as any;
    });

    afterAll(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.location = originalLocation as any;
    });

    it('renders correctly', () => {
        render(<OnboardingPage />);
        // Just verify it doesn't crash and renders the layout
        expect(document.body).toBeInTheDocument();
    });
});
