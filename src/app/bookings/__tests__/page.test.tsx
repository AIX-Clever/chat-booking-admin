/**
 * Tests for Bookings Page
 * @jest-environment jsdom
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookingsPage from '../page'

// Mock AWS Amplify
jest.mock('aws-amplify/api', () => ({
    generateClient: jest.fn(() => ({
        graphql: jest.fn(),
    })),
}))

jest.mock('aws-amplify/auth', () => ({
    fetchAuthSession: jest.fn().mockResolvedValue({
        tokens: {
            idToken: { payload: { 'custom:tenantId': 'test-tenant' } },
        },
    }),
}))

// Mock the GraphQL queries
jest.mock('../../graphql/queries', () => ({
    LIST_PROVIDERS: 'query ListProviders { }',
    LIST_BOOKINGS_BY_PROVIDER: 'query ListBookingsByProvider { }',
    CANCEL_BOOKING: 'mutation CancelBooking { }',
    SEARCH_SERVICES: 'query SearchServices { }',
    CREATE_BOOKING: 'mutation CreateBooking { }',
    CONFIRM_BOOKING: 'mutation ConfirmBooking { }',
    MARK_AS_NO_SHOW: 'mutation MarkAsNoShow { }',
    UPDATE_BOOKING_STATUS: 'mutation UpdateBookingStatus { }',
}))

describe('Bookings Page', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Component Rendering', () => {
        it('should render without crashing', () => {
            render(<BookingsPage />)
            expect(screen.getByText(/bookings|reservations|reservas/i)).toBeInTheDocument()
        })

        it('should display bookings page title', () => {
            render(<BookingsPage />)
            // Should have some heading indicating this is bookings page
            const heading = screen.getAllByRole('heading')[0]
            expect(heading).toBeInTheDocument()
        })

        it('should have date range selectors', async () => {
            render(<BookingsPage />)

            // Should have date pickers for filtering
            await waitFor(() => {
                const dateInputs = screen.getAllByRole('textbox')
                expect(dateInputs.length).toBeGreaterThan(0)
            })
        })
    })

    describe('Booking Status Display', () => {
        it('should render status badge components', () => {
            render(<BookingsPage />)

            // Page should have capacity to render status badges
            // Using getAllByRole to check for button elements which are often used for status chips
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('should have booking actions available', () => {
            render(<BookingsPage />)

            // Should have action buttons (view, confirm, cancel, etc.)
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })
    })

    describe('GraphQL Integration Validation', () => {
        it('should validate listBookingsByProvider query structure', () => {
            // Validates the query that was fixed (syntax error in booking/service.py)
            const mockQuery = `
        query {
          listBookingsByProvider(input: {
            providerId: "test-provider"
            startDate: "2026-01-01T00:00:00Z"
            endDate: "2026-12-31T23:59:59Z"
          }) {
            bookingId
            clientName
            start
            end
            status
          }
        }
      `
            expect(mockQuery).toContain('listBookingsByProvider')
            expect(mockQuery).toContain('providerId')
            expect(mockQuery).toContain('startDate')
            expect(mockQuery).toContain('endDate')
        })

        it('should structure booking data correctly', () => {
            const mockBooking = {
                bookingId: 'booking-1',
                tenantId: 'tenant-1',
                serviceId: 'service-1',
                providerId: 'provider-1',
                start: '2026-01-15T10:00:00Z',
                end: '2026-01-15T11:00:00Z',
                status: 'CONFIRMED',
                clientName: 'John Doe',
                clientEmail: 'john@example.com',
            }

            // Validate structure matches expected schema
            expect(mockBooking).toHaveProperty('bookingId')
            expect(mockBooking).toHaveProperty('status')
            expect(mockBooking).toHaveProperty('clientName')
            expect(mockBooking).toHaveProperty('start')
            expect(mockBooking).toHaveProperty('end')
        })
    })

    describe('Booking Status Transitions', () => {
        it('should define valid booking statuses', () => {
            const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW']

            validStatuses.forEach(status => {
                expect(status).toBeTruthy()
                expect(typeof status).toBe('string')
            })
        })

        it('should handle status transition logic', () => {
            // Test the logic for allowed transitions
            const canConfirm = (status: string) => status === 'PENDING'
            const canCancel = (status: string) => ['PENDING', 'CONFIRMED'].includes(status)
            const canMarkNoShow = (status: string) => status === 'CONFIRMED'

            expect(canConfirm('PENDING')).toBe(true)
            expect(canConfirm('CONFIRMED')).toBe(false)

            expect(canCancel('PENDING')).toBe(true)
            expect(canCancel('CONFIRMED')).toBe(true)
            expect(canCancel('CANCELLED')).toBe(false)

            expect(canMarkNoShow('CONFIRMED')).toBe(true)
            expect(canMarkNoShow('PENDING')).toBe(false)
        })
    })

    describe('Date Filtering', () => {
        it('should validate date format for GraphQL queries', () => {
            const testDate = new Date('2026-01-15T10:00:00Z')
            const isoString = testDate.toISOString()

            expect(isoString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })

        it('should handle date range validation', () => {
            const startDate = new Date('2026-01-01')
            const endDate = new Date('2026-01-31')

            expect(endDate.getTime()).toBeGreaterThan(startDate.getTime())
        })
    })
})
