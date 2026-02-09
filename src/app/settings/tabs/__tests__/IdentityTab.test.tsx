import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import IdentityTab from '../IdentityTab';
import { BusinessProfile } from '../../../../types/settings';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

const mockProfile: BusinessProfile = {
    centerName: 'Test Center',
    bio: 'Test Bio',
    profession: 'Test Profession',
    specializations: ['Spec 1', 'Spec 2'],
    operatingHours: '9-5',
    phone1: '123456789',
    phone2: '987654321',
    email: 'test@example.com',
    website: 'https://test.com',
    address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'CL',
    },
    timezone: 'America/Santiago',
};

describe('IdentityTab', () => {
    const mockSetProfile = jest.fn();
    const mockOnSave = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with initial profile data', () => {
        render(
            <IdentityTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        expect(screen.getByDisplayValue('Test Center')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Bio')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123456789')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Test St')).toBeInTheDocument();

        // Use getByDisplayValue for the Select's hidden input
        expect(screen.getByDisplayValue('CL')).toBeInTheDocument();
    });

    it('updates centerName and calls setProfile', () => {
        render(
            <IdentityTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        // Use getByRole if getByLabelText is failing, or ensure uniqueness
        const input = screen.getByRole('textbox', { name: 'centerName' });
        fireEvent.change(input, { target: { value: 'New Center Name' } });

        expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({
            centerName: 'New Center Name'
        }));
    });

    it('updates address street and calls setProfile', () => {
        render(
            <IdentityTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        const input = screen.getByRole('textbox', { name: 'address' });
        fireEvent.change(input, { target: { value: '456 New St' } });

        expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({
            address: expect.objectContaining({
                street: '456 New St'
            })
        }));
    });

    it('calls onSave when save button is clicked', () => {
        render(
            <IdentityTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        const saveButton = screen.getByText('save');
        fireEvent.click(saveButton);

        expect(mockOnSave).toHaveBeenCalled();
    });

    it('handles logo file change', async () => {
        const readerMock = {
            readAsDataURL: jest.fn(),
            result: 'data:image/png;base64,hello',
            onloadend: null as any,
        };
        window.FileReader = jest.fn().mockImplementation(() => readerMock) as any;

        render(
            <IdentityTab
                profile={mockProfile}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        const file = new File(['hello'], 'hello.png', { type: 'image/png' });
        // Find input by its hidden property since MUI often wraps it
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        fireEvent.change(input, { target: { files: [file] } });

        // Manually trigger onloadend
        if (readerMock.onloadend) {
            readerMock.onloadend({} as any);
        }

        expect(mockSetProfile).toHaveBeenCalledWith(expect.objectContaining({
            logoUrl: 'data:image/png;base64,hello'
        }));
    });

    it('renders with null profile (default state)', () => {
        render(
            <IdentityTab
                profile={null}
                setProfile={mockSetProfile}
                onSave={mockOnSave}
            />
        );

        // Debug to see what's rendered
        screen.debug();

        // Check if the input exists and is empty
        const input = screen.getByRole('textbox', { name: 'centerName' });
        expect(input).toHaveValue('');
    });
});
