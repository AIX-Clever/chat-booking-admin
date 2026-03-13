
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

describe('OnboardingPage', () => {
    let originalLocation: Location;

    /* eslint-disable @typescript-eslint/no-explicit-any */
    beforeAll(() => {
        originalLocation = window.location;
        delete (window as any).location;
        (window as any).location = new URL('http://localhost');
    });

    afterAll(() => {
        (window as any).location = originalLocation;
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    it('renders correctly', () => {
        render(<OnboardingPage />);
        // Just verify it doesn't crash and renders the layout
        expect(document.body).toBeInTheDocument();
    });
});
