import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AmplifyProvider from '../AmplifyProvider';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';

// Mock Amplify
jest.mock('aws-amplify', () => ({
    Amplify: {
        configure: jest.fn()
    }
}));

// Mock Authenticator.Provider
jest.mock('@aws-amplify/ui-react', () => ({
    Authenticator: {
        Provider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>
    }
}));

describe('AmplifyProvider component', () => {
    it('should call Amplify.configure on module load', () => {
        // Module level side effects happen when imported
        // Since we mock Amplify.configure, we can check if it was called
        expect(Amplify.configure).toHaveBeenCalled();
    });

    it('should render children within Authenticator.Provider', () => {
        render(
            <AmplifyProvider>
                <div data-testid="children">Content</div>
            </AmplifyProvider>
        );

        expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
        expect(screen.getByTestId('children')).toBeInTheDocument();
    });
});
