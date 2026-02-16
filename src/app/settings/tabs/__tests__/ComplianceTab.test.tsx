import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ComplianceTab from '../ComplianceTab';

// Mock dependencies
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

describe('ComplianceTab', () => {
    const mockProfile = {
        legalName: 'Test Company',
        taxId: '12345678-9',
        professionalLicense: 'DDS-12345',
        privacyPolicyUrl: 'https://example.com/privacy',
        dpoContact: 'dpo@example.com',
        cookieBannerActive: true,
        dataRetentionDays: 365,
    };

    const mockSetProfile = jest.fn();
    const mockOnSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <ComplianceTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );
    };

    it('renders all compliance fields correctly', () => {
        renderComponent();

        // Check for section headers (translated keys)
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('legalInfo')).toBeInTheDocument();
        expect(screen.getByText('professionalInfo')).toBeInTheDocument();
        expect(screen.getByText('gdpr')).toBeInTheDocument();
        expect(screen.getByText('cookieConsent')).toBeInTheDocument();

        // Check for input fields with values
        expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12345678-9')).toBeInTheDocument();
        expect(screen.getByDisplayValue('DDS-12345')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://example.com/privacy')).toBeInTheDocument();
        expect(screen.getByDisplayValue('dpo@example.com')).toBeInTheDocument();
    });

    it('calls onSave when save button is clicked', () => {
        renderComponent();

        const saveButton = screen.getByText('saveButton');
        fireEvent.click(saveButton);

        expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('updates profile when fields are changed', () => {
        renderComponent();

        // Label corresponds to translation key
        // Need to be careful with Material UI labels, sometimes they are separated.
        // Let's try to find by label text which should be the key 'legalName'
        const legalNameInput = screen.getByLabelText('legalName');
        fireEvent.change(legalNameInput, { target: { value: 'New Company Name' } });

        expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({
            legalName: 'New Company Name'
        }));
    });

    it('toggles cookie banner switch', () => {
        renderComponent();

        const switchElement = screen.getByLabelText('cookieBannerLabel');
        fireEvent.click(switchElement);

        expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({
            cookieBannerActive: false
        }));
    });
});
