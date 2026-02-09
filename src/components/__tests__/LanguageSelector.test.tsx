import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LanguageSelector from '../LanguageSelector';
import { useLocale } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
    useLocale: jest.fn()
}));

describe('LanguageSelector component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useLocale as jest.Mock).mockReturnValue('es');
    });

    it('should render current language flag', () => {
        render(<LanguageSelector />);
        expect(screen.getByText('🇪🇸')).toBeInTheDocument();
    });

    it('should open menu when clicked', () => {
        render(<LanguageSelector />);
        fireEvent.click(screen.getByRole('button', { name: /change language/i }));

        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Português')).toBeInTheDocument();
    });

    it('should dispatch languageChange event when a language is selected', () => {
        const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
        render(<LanguageSelector />);

        fireEvent.click(screen.getByRole('button', { name: /change language/i }));
        fireEvent.click(screen.getByText('English'));

        expect(dispatchSpy).toHaveBeenCalled();
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('languageChange');
        expect(event.detail.locale).toBe('en');

        dispatchSpy.mockRestore();
    });
});
