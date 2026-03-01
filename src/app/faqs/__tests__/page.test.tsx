
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FAQsPage from '../page';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

const mockGraphql = jest.fn();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: (...args: unknown[]) => mockGraphql(...args),
    })),
}));

describe('FAQsPage', () => {
    const mockFaqs = [
        { faqId: 'f1', question: 'Q1', answer: 'A1', category: 'C1', active: true },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({ data: { listFaqs: mockFaqs } });
    });

    it('renders and fetches FAQs', async () => {
        render(<FAQsPage />);
        await waitFor(() => {
            expect(screen.getByText('Q1')).toBeInTheDocument();
        });
    });
});
