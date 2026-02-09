import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmDialog from '../ConfirmDialog';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {ui}
        </ThemeProvider>
    );
};

describe('ConfirmDialog component', () => {
    const defaultProps = {
        open: true,
        title: 'Confirm Action',
        content: 'Are you sure you want to do this?',
        onClose: jest.fn(),
        onConfirm: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render title and content correctly', () => {
        renderWithTheme(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to do this?')).toBeInTheDocument();
    });

    it('should call onClose when cancel button is clicked', () => {
        renderWithTheme(<ConfirmDialog {...defaultProps} cancelText="No way" />);

        fireEvent.click(screen.getByText('No way'));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when confirm button is clicked', () => {
        renderWithTheme(<ConfirmDialog {...defaultProps} confirmText="Yes, do it" />);

        fireEvent.click(screen.getByText('Yes, do it'));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should not render when open is false', () => {
        renderWithTheme(<ConfirmDialog {...defaultProps} open={false} />);

        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('should apply correct color to confirm button', () => {
        renderWithTheme(<ConfirmDialog {...defaultProps} confirmColor="primary" />);

        const confirmButton = screen.getByText('Delete');
        expect(confirmButton).toHaveClass('MuiButton-containedPrimary');
    });
});
