import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// 1. Mock Amplify correctly with hoisted variables
const mockGraphQL = jest.fn();

jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn().mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graphql: (...args: any[]) => mockGraphQL(...args)
    })
}));

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({
        tokens: {
            idToken: {
                payload: {
                    'custom:tenantId': 'test-tenant-id'
                }
            }
        }
    })
}));

jest.mock('@aws-amplify/ui-react', () => ({
    useAuthenticator: () => ({
        user: { username: 'testuser' },
        signOut: jest.fn()
    })
}));

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Import AFTER mocks
import BillingTab from '../BillingTab';

describe('BillingTab', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock getTenant and listInvoices
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockGraphQL.mockImplementation(({ query }: any) => {
            if (query.includes('getTenant')) {
                return Promise.resolve({
                    data: {
                        getTenant: {
                            tenantId: 'test-tenant-id',
                            plan: 'PRO',
                            settings: {
                                billing: {
                                    tipoDte: '33',
                                    rut: '12345678-9',
                                    name: 'Test Business'
                                },
                                profile: {
                                    privacyPolicyUrl: 'https://example.com/privacy',
                                    cookieBannerActive: true
                                }
                            }
                        }
                    }
                });
            }
            if (query.includes('listInvoices')) {
                return Promise.resolve({
                    data: {
                        listInvoices: []
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });
    });

    it('renders plan details and billing preferences', async () => {
        render(<BillingTab />);

        await waitFor(() => {
            expect(screen.getByText('Preferencias de Facturación')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByDisplayValue('12345678-9')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Business')).toBeInTheDocument();
    });

    it('renders legal and privacy section correctly', async () => {
        render(<BillingTab />);

        await waitFor(() => {
            expect(screen.getByText('Privacidad y Legal')).toBeInTheDocument();
        }, { timeout: 3000 });

        expect(screen.getByDisplayValue('https://example.com/privacy')).toBeInTheDocument();
        expect(screen.getByText('Banner de Cookies')).toBeInTheDocument();
    });

    it('updates legal fields correctly', async () => {
        render(<BillingTab />);

        await waitFor(() => {
            expect(screen.getByDisplayValue('https://example.com/privacy')).toBeInTheDocument();
        });

        const privacyInput = screen.getByLabelText('URL Política de Privacidad');
        fireEvent.change(privacyInput, { target: { value: 'https://new-privacy.com' } });

        expect(privacyInput).toHaveValue('https://new-privacy.com');
    });
});
