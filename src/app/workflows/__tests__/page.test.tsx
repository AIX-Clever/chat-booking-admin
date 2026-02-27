import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import WorkflowsListPage from '../page';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Mock PlanGuard
const PlanGuard = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
PlanGuard.displayName = 'PlanGuard';
jest.mock('../../../components/PlanGuard', () => PlanGuard);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGraphql = jest.fn<any, any[]>();
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graphql: (...args: any[]) => mockGraphql(...args),
    })),
}));

describe('WorkflowsListPage', () => {
    const mockWorkflows = [
        { workflowId: 'w1', name: 'Test Workflow', description: 'Desc', isActive: true },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockGraphql.mockResolvedValue({ data: { listWorkflows: mockWorkflows } });
    });

    it('renders and fetches workflows', async () => {
        render(<WorkflowsListPage />);
        await waitFor(() => {
            expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        });
    });
});
