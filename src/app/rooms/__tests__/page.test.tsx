/**
 * Tests for Rooms Page
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import RoomsPage from '../page'

// Mock the GraphQL repository
jest.mock('@/repositories/GraphQLRoomRepository', () => {
    return {
        GraphQLRoomRepository: jest.fn().mockImplementation(() => ({
            listRooms: jest.fn().mockResolvedValue([
                {
                    roomId: 'room-1',
                    name: 'Conference Room A',
                    description: 'Large meeting room',
                    capacity: 10,
                    status: 'ACTIVE',
                    metadata: null,
                },
                {
                    roomId: 'room-2',
                    name: 'Meeting Room B',
                    description: 'Small meeting room',
                    capacity: 4,
                    status: 'ACTIVE',
                    metadata: null,
                },
            ]),
            createRoom: jest.fn().mockResolvedValue({
                roomId: 'room-3',
                name: 'New Room',
                capacity: 6,
                status: 'ACTIVE',
            }),
            updateRoom: jest.fn(),
            deleteRoom: jest.fn(),
        })),
    }
})

describe('Rooms Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<RoomsPage />)
            expect(screen.getByText(/rooms/i)).toBeInTheDocument()
        })

        it('should display rooms list without null error', async () => {
            render(<RoomsPage />)

            // Wait for rooms to load
            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument()
            }, { timeout: 3000 })

            expect(screen.getByText('Meeting Room B')).toBeInTheDocument()
        })

        it('should display room capacity', async () => {
            render(<RoomsPage />)

            await waitFor(() => {
                expect(screen.getByText(/10/)).toBeInTheDocument() // Capacity of room 1
            })
        })

        it('should display loading state initially', () => {
            render(<RoomsPage />)
            // Should show loading indicator before data loads
            expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeTruthy()
        })
    })

    describe('Room Management', () => {
        it('should have create room button', async () => {
            render(<RoomsPage />)

            await waitFor(() => {
                const createButton = screen.getByRole('button', { name: /add|create/i })
                expect(createButton).toBeInTheDocument()
            })
        })

        it('should validate capacity is present', async () => {
            render(<RoomsPage />)

            // Wait for data to load
            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument()
            })

            // Verify capacity column exists and shows number
            const capacityCells = screen.getAllByText(/^\d+$/)
            expect(capacityCells.length).toBeGreaterThan(0)
        })

        it('should display room status chips', async () => {
            render(<RoomsPage />)

            await waitFor(() => {
                const statusChips = screen.getAllByText(/ACTIVE/i)
                expect(statusChips.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Data Validation', () => {
        it('should display multiple rooms when available', async () => {
            render(<RoomsPage />)

            await waitFor(() => {
                expect(screen.getByText('Conference Room A')).toBeInTheDocument()
                expect(screen.getByText('Meeting Room B')).toBeInTheDocument()
            })
        })

        it('should handle room descriptions', async () => {
            render(<RoomsPage />)

            await waitFor(() => {
                expect(screen.getByText(/Large meeting room/i)).toBeInTheDocument()
            })
        })
    })
})
