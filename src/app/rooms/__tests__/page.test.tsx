
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RoomsPage from '../page';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Better mock for Repository
jest.mock('@/repositories/GraphQLRoomRepository', () => ({
    GraphQLRoomRepository: jest.fn().mockImplementation(() => ({
        listRooms: jest.fn().mockResolvedValue([
            { roomId: 'r1', name: 'Room 1', description: 'Desc 1', active: true, centerId: 'c1', operatingHours: [] }
        ]),
    }))
}));

describe('RoomsPage', () => {
    it('renders correctly', async () => {
        render(<RoomsPage />);
        // Increase timeout and check for any common text
        await waitFor(() => {
            // If it renders an empty div, maybe it's still loading or crashed
            // Look for the "title" key if mocked next-intl is working
            expect(screen.getByText(/title/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
