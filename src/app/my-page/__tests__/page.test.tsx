
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MyPage from '../page';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { id: 't1', slug: 'test-slug', settings: '{}' },
        loading: false
    }),
}));

const mockGraphql = jest.fn();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: (...args: any[]) => mockGraphql(...args),
    })),
}));

describe('MyPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({
            data: {
                listProviders: [],
                getPublicLinkStatus: {
                    isPublished: true,
                    slug: 'test-slug',
                    publicUrl: 'https://agendar.holalucia.cl/test-slug',
                    completenessPercentage: 100,
                    completenessChecklist: []
                }
            }
        });
    });

    it('renders correctly', async () => {
        render(<MyPage />);
        // Use findByText to handle the loading state transition
        expect(await screen.findByText(/test-slug/i)).toBeInTheDocument();
    });
});
