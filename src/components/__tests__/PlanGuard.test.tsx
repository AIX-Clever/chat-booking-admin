import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanGuard from '../PlanGuard';
import { useTenant } from '../../context/TenantContext';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { navigateTo } from '../../utils/navigation';

// Mock dependencies
jest.mock('../../context/TenantContext', () => ({
    useTenant: jest.fn()
}));

jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn().mockReturnValue({
        graphql: jest.fn()
    })
}));

jest.mock('aws-amplify/auth', () => ({
    fetchUserAttributes: jest.fn()
}));

jest.mock('../../utils/navigation', () => ({
    navigateTo: jest.fn(),
    getCurrentUrl: jest.fn().mockReturnValue('http://localhost/')
}));

// Mock UpgradeContent to simplify PlanGuard testing
jest.mock('../common/UpgradeContent', () => {
    return function MockUpgradeContent({ onUpgrade, loading }: any) {
        return (
            <div>
                <button onClick={onUpgrade} disabled={loading}>Mock Upgrade Button</button>
            </div>
        );
    };
});

describe('PlanGuard component', () => {
    const defaultProps = {
        minPlan: 'PRO' as const,
        children: <div data-testid="protected-content">Protected content</div>
    };

    const mockGraphql = generateClient().graphql as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should show loading state when tenant is loading', () => {
        (useTenant as jest.Mock).mockReturnValue({ loading: true, tenant: null });
        render(<PlanGuard {...defaultProps} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show protected content if plan level is sufficient', () => {
        (useTenant as jest.Mock).mockReturnValue({
            loading: false,
            tenant: { plan: 'BUSINESS' }
        });
        render(<PlanGuard {...defaultProps} />);
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should show upgrade content if plan level is insufficient', () => {
        (useTenant as jest.Mock).mockReturnValue({
            loading: false,
            tenant: { plan: 'LITE' }
        });
        render(<PlanGuard {...defaultProps} />);
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.getByText('Mock Upgrade Button')).toBeInTheDocument();
    });

    it('should handle upgrade flow', async () => {
        (useTenant as jest.Mock).mockReturnValue({
            loading: false,
            tenant: { plan: 'LITE' }
        });
        (fetchUserAttributes as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        mockGraphql.mockResolvedValue({
            data: { subscribe: { initPoint: 'https://checkout.url' } }
        });

        render(<PlanGuard {...defaultProps} />);
        fireEvent.click(screen.getByText('Mock Upgrade Button'));

        await waitFor(() => {
            expect(navigateTo).toHaveBeenCalledWith('https://checkout.url');
        });
    });

    it('should show content in overlay variant', () => {
        (useTenant as jest.Mock).mockReturnValue({
            loading: false,
            tenant: { plan: 'LITE' }
        });
        render(<PlanGuard {...defaultProps} variant="overlay" />);
        // In overlay, content is present but blurred
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.getByText('Mock Upgrade Button')).toBeInTheDocument();
    });
});
