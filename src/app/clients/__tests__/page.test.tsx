
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ClientsPage from '../page';

// Standardized next-intl mock
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock Amplify correctly
const mockGraphql = jest.fn();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: (...args: any[]) => mockGraphql(...args),
    })),
}));

// Mock GraphQL queries - Correct relative path
jest.mock('../../../graphql/client-queries', () => ({
    LIST_CLIENTS: 'query ListClients { listClients { id names { given family } contactInfo { system value } createdAt } }',
}));

// Mock ClientForm
jest.mock('../../../components/clients/ClientForm', () => {
    return {
        __esModule: true,
        default: () => <div data-testid="client-form">ClientForm</div>,
    };
});

describe('ClientsPage', () => {
    const mockClients = [
        {
            id: 'c1',
            names: { given: 'John', family: 'Doe' },
            identifiers: [],
            contactInfo: [],
            createdAt: new Date().toISOString()
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({ data: { listClients: mockClients } });
    });

    it('renders correctly', async () => {
        render(<ClientsPage />);
        await waitFor(() => {
            expect(screen.getByText(/title/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        await waitFor(() => {
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
