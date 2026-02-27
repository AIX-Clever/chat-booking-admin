import React from 'react';
import { render, screen } from '@testing-library/react';
import BookingWidgetPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock TenantContext
jest.mock('../../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { slug: 'tenant1' },
    }),
}));

describe('BookingWidgetPage', () => {
    it('renders correctly', async () => {
        render(<BookingWidgetPage />);
        expect(await screen.findByText('title')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/tenant1/)).toBeInTheDocument();
    });
});
