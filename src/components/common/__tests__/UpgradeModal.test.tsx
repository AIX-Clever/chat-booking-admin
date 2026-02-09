import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpgradeModal from '../UpgradeModal';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { navigateTo, getCurrentUrl } from '../../../utils/navigation';

// Mock Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn().mockReturnValue({
        graphql: jest.fn()
    })
}));

jest.mock('aws-amplify/auth', () => ({
    fetchUserAttributes: jest.fn()
}));

// Mock navigation utility
jest.mock('../../../utils/navigation', () => ({
    navigateTo: jest.fn(),
    getCurrentUrl: jest.fn().mockReturnValue('http://localhost/')
}));

// Mock UpgradeContent to simplify testing UpgradeModal logic
jest.mock('../UpgradeContent', () => {
    return function MockUpgradeContent({ onUpgrade, onClose, loading }: any) {
        return (
            <div>
                <button onClick={onUpgrade} disabled={loading}>Mock Upgrade</button>
                <button onClick={onClose}>Mock Close</button>
                {loading && <span>Loading...</span>}
            </div>
        );
    };
});

describe('UpgradeModal component', () => {
    const mockOnClose = jest.fn();
    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        feature: 'AI_CHAT' as any,
        currentPlan: 'LITE'
    };

    const mockGraphql = generateClient().graphql as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call onClose when close button is clicked', () => {
        render(<UpgradeModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Mock Close'));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle successful upgrade redirection', async () => {
        (fetchUserAttributes as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        mockGraphql.mockResolvedValue({
            data: {
                subscribe: {
                    initPoint: 'https://checkout.mercadopago.com/init'
                }
            }
        });

        render(<UpgradeModal {...defaultProps} />);

        fireEvent.click(screen.getByText('Mock Upgrade'));

        await waitFor(() => {
            expect(navigateTo).toHaveBeenCalledWith('https://checkout.mercadopago.com/init');
        });
    });

    it('should handle upgrade failure gracefully', async () => {
        (fetchUserAttributes as jest.Mock).mockResolvedValue({ email: 'test@example.com' });
        mockGraphql.mockRejectedValue(new Error('API Error'));

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<UpgradeModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Mock Upgrade'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error creating subscription:', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});
