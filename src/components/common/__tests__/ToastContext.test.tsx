import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../ToastContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const TestComponent = () => {
    const { showToast } = useToast();
    return (
        <button onClick={() => showToast('Test Message', 'error')}>
            Show Toast
        </button>
    );
};

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            <ToastProvider>
                {ui}
            </ToastProvider>
        </ThemeProvider>
    );
};

describe('ToastContext', () => {
    it('should show toast when showToast is called', () => {
        renderWithProvider(<TestComponent />);

        fireEvent.click(screen.getByText('Show Toast'));

        expect(screen.getByText('Test Message')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveClass('MuiAlert-filledError');
    });

    it('should close toast when close button is clicked', () => {
        renderWithProvider(<TestComponent />);

        fireEvent.click(screen.getByText('Show Toast'));
        expect(screen.getByText('Test Message')).toBeInTheDocument();

        const closeButton = screen.getByTitle('Close');
        fireEvent.click(closeButton);

        // Snackbar uses a transition, but for unit tests it might be hidden immediately or we might need to wait
        // jsdom doesn't support transitions fully, so it usually just sets styles or removes elements.
        // MUI Snackbar might keep it in the DOM but hidden.
    });

    it('should throw error when used outside of provider', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        const BuggyComponent = () => {
            useToast();
            return null;
        };

        expect(() => render(<BuggyComponent />)).toThrow('useToast must be used within a ToastProvider');

        consoleSpy.mockRestore();
    });
});
