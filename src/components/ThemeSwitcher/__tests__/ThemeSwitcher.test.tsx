import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeSwitcher from '../ThemeSwitcher';
import { useThemeContext } from '../../../context/ThemeContext';

// Mock useThemeContext
jest.mock('../../../context/ThemeContext', () => ({
    useThemeContext: jest.fn()
}));

describe('ThemeSwitcher component', () => {
    const mockToggleMode = jest.fn();
    const mockSetPaletteName = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useThemeContext as jest.Mock).mockReturnValue({
            mode: 'light',
            toggleMode: mockToggleMode,
            paletteName: 'default',
            setPaletteName: mockSetPaletteName
        });
    });

    it('should call toggleMode when theme icon is clicked', () => {
        render(<ThemeSwitcher />);

        fireEvent.click(screen.getByLabelText('Toggle light/dark theme'));
        expect(mockToggleMode).toHaveBeenCalledTimes(1);
    });

    it('should open palette menu when palette icon is clicked', () => {
        render(<ThemeSwitcher />);

        fireEvent.click(screen.getByLabelText('Change color palette'));
        expect(screen.getByText('Default')).toBeInTheDocument();
        // Since palettes are defined in theme/palettes, we should see them in the menu
    });

    it('should call setPaletteName when a palette is selected', () => {
        render(<ThemeSwitcher />);

        fireEvent.click(screen.getByLabelText('Change color palette'));
        // The menu contains palette names capitalized
        fireEvent.click(screen.getByText('Default'));

        expect(mockSetPaletteName).toHaveBeenCalledWith('default');
    });

    it('should render correct icon based on mode', () => {
        const { rerender } = render(<ThemeSwitcher />);
        // light mode -> show Brightness4Icon (which has a certain path or data-testid)
        // Actually, we can just check if it renders without crashing
        expect(screen.getByTestId('Brightness4Icon')).toBeInTheDocument();

        (useThemeContext as jest.Mock).mockReturnValue({
            mode: 'dark',
            toggleMode: mockToggleMode,
            paletteName: 'default',
            setPaletteName: mockSetPaletteName
        });

        rerender(<ThemeSwitcher />);
        expect(screen.getByTestId('Brightness7Icon')).toBeInTheDocument();
    });
});
