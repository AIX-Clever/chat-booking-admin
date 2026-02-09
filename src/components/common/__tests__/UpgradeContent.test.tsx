import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpgradeContent from '../UpgradeContent';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: jest.fn().mockReturnValue((key: string, params?: any) => {
        if (params?.plan) return `${key} ${params.plan}`;
        return key;
    })
}));

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('UpgradeContent component', () => {
    const defaultProps = {
        feature: 'AI' as const,
        targetPlan: 'PRO',
        onUpgrade: jest.fn(),
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correct title and benefits for AI feature', () => {
        renderWithTheme(<UpgradeContent {...defaultProps} />);

        expect(screen.getByText('unlockAi.title')).toBeInTheDocument();
        expect(screen.getByText('unlockAi.benefit1')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /common.upgradeTo PRO/i })).toBeInTheDocument();
    });

    it('should render correct title for other features', () => {
        const { rerender } = renderWithTheme(<UpgradeContent {...defaultProps} feature="TEAM" />);
        expect(screen.getByText('team.title')).toBeInTheDocument();

        rerender(
            <ThemeProvider theme={theme}>
                <UpgradeContent {...defaultProps} feature="USAGE" />
            </ThemeProvider>
        );
        expect(screen.getByText('usage.title')).toBeInTheDocument();

        rerender(
            <ThemeProvider theme={theme}>
                <UpgradeContent {...defaultProps} feature="WORKFLOW" />
            </ThemeProvider>
        );
        expect(screen.getByText('workflow.title')).toBeInTheDocument();
    });

    it('should call onUpgrade when primary button is clicked', () => {
        renderWithTheme(<UpgradeContent {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /common.upgradeTo PRO/i }));
        expect(defaultProps.onUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button is clicked', () => {
        renderWithTheme(<UpgradeContent {...defaultProps} />);

        // Target the Close icon button or the Maybe Later button
        fireEvent.click(screen.getByRole('button', { name: /common.maybeLater/i }));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should show loading state', () => {
        renderWithTheme(<UpgradeContent {...defaultProps} loading={true} />);

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        // The upgrade button should be disabled and contain the progressbar
        // It won't have the text 'common.upgradeTo PRO' anymore
        const buttons = screen.getAllByRole('button');
        const upgradeButton = buttons.find(b => b.querySelector('[role="progressbar"]'));
        expect(upgradeButton).toBeDisabled();
    });
});
