import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ApiKeysTab from '../ApiKeysTab';
import { generateClient } from 'aws-amplify/api';

// Mock generateClient
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(),
}));

// Mock next-intl
// Mock next-intl
const mockT = (key: string) => key;
jest.mock('next-intl', () => ({
    useTranslations: () => mockT,
}));

// Mock PlanGuard
jest.mock('@/components/PlanGuard', () => {
    const MockPlanGuard = ({ children }: { children: React.ReactNode }) => <div data-testid="plan-guard">{children}</div>;
    MockPlanGuard.displayName = 'MockPlanGuard';
    return MockPlanGuard;
});

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

describe('ApiKeysTab', () => {
    const mockGraphql = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (generateClient as jest.Mock).mockReturnValue({
            graphql: mockGraphql,
        });
    });

    const mockApiKeys = [
        {
            apiKeyId: 'key-1',
            name: 'Test Key 1',
            keyPreview: 'preview-1',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
        },
        {
            apiKeyId: 'key-2',
            name: 'Test Key 2',
            keyPreview: 'preview-2',
            status: 'REVOKED',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        },
    ];

    it('renders loading state initially', async () => {
        mockGraphql.mockReturnValue(new Promise(() => { })); // Never resolves
        render(<ApiKeysTab />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('renders empty state when no keys', async () => {
        mockGraphql.mockResolvedValue({ data: { listApiKeys: [] } });
        render(<ApiKeysTab />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        expect(screen.getByText('noKeys')).toBeInTheDocument();
    });

    it('renders list of api keys', async () => {
        mockGraphql.mockResolvedValue({ data: { listApiKeys: mockApiKeys } });
        render(<ApiKeysTab />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Test Key 1')).toBeInTheDocument();
        expect(screen.getByText('Test Key 2')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('revoked')).toBeInTheDocument();
    });

    it('opens create dialog and creates a new key', async () => {
        mockGraphql.mockResolvedValueOnce({ data: { listApiKeys: [] } });
        render(<ApiKeysTab />);

        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

        // Open dialog
        fireEvent.click(screen.getByText('createKey'));
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Enter name
        const input = screen.getByPlaceholderText('e.g. Website Integration');
        fireEvent.change(input, { target: { value: 'New Key' } });

        // Mock create response
        mockGraphql.mockResolvedValueOnce({
            data: {
                createApiKey: {
                    apiKeyId: 'new-key',
                    name: 'New Key',
                    keyPreview: 'new-preview',
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString(),
                    apiKey: 'secret-key-123'
                }
            }
        });

        // Click create
        fireEvent.click(screen.getByText('add'));

        // Should show secret
        await waitFor(() => {
            expect(screen.getByText('createDialog.successTitle')).toBeInTheDocument();
        });

        // Verify secret is shown
        expect(screen.getByDisplayValue('secret-key-123')).toBeInTheDocument();

        // Verify snackbar
        expect(screen.getByText('keyCreated')).toBeInTheDocument();
    });

    it('handles copy to clipboard', async () => {
        mockGraphql.mockResolvedValue({ data: { listApiKeys: [] } });
        render(<ApiKeysTab />);
        await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());

        // Open dialog and reach success state (simulated by mocking state if possible, but easier via flow)
        fireEvent.click(screen.getByText('createKey'));
        const input = screen.getByPlaceholderText('e.g. Website Integration');
        fireEvent.change(input, { target: { value: 'New Key' } });

        mockGraphql.mockResolvedValueOnce({
            data: {
                createApiKey: {
                    apiKeyId: 'new-key',
                    name: 'New Key',
                    keyPreview: 'new-preview',
                    status: 'ACTIVE',
                    createdAt: new Date().toISOString(),
                    apiKey: 'secret-key-123'
                }
            }
        });

        fireEvent.click(screen.getByText('add'));
        await waitFor(() => expect(screen.getByDisplayValue('secret-key-123')).toBeInTheDocument());

        // Find copy button (icon button inside Adornment)
        // Find copy button by aria-label
        const btn = screen.getByRole('button', { name: /copy/i });

        fireEvent.click(btn);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('secret-key-123');
            expect(screen.getByText('copied')).toBeInTheDocument();
        });
    });

    it('revokes a key', async () => {
        mockGraphql.mockResolvedValue({ data: { listApiKeys: mockApiKeys } });
        render(<ApiKeysTab />);

        await waitFor(() => expect(screen.getByText('Test Key 1')).toBeInTheDocument());

        // Find delete button for the first key (ACTIVE)
        // Ensure we pick the active one. "Test Key 1" row.
        const row = screen.getByText('Test Key 1').closest('tr');
        const deleteButton = within(row as HTMLElement).getByTitle('revoke');

        fireEvent.click(deleteButton);

        // Confirm dialog should appear
        expect(screen.getByText('revokeDialog.content')).toBeInTheDocument();

        mockGraphql.mockResolvedValueOnce({}); // Revoke returns void/ignored

        // Click confirm
        fireEvent.click(screen.getByText('revokeDialog.confirm'));

        await waitFor(() => {
            expect(screen.getByText('keyRevoked')).toBeInTheDocument();
        });

        // Verify graphql call
        expect(mockGraphql).toHaveBeenCalledWith(expect.objectContaining({
            variables: { apiKeyId: 'key-1' }
        }));
    });

    it('handles errors gracefully', async () => {
        mockGraphql.mockRejectedValue(new Error('Fetch failed'));
        render(<ApiKeysTab />);

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument(); // It hides spinner on error in finally block
        });

        // Since I added snackbar on error fetching:
        await waitFor(() => {
            expect(screen.getByText('errorFetching')).toBeInTheDocument();
        });
    });
});
