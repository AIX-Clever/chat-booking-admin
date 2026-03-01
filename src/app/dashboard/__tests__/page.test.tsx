
import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../page';

jest.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

// Relative path from src/app/dashboard/__tests__/page.test.tsx:
jest.mock('../../../hooks/useDashboardMetrics', () => ({
    useDashboardMetrics: () => ({
        metrics: {
            summary: { revenue: 500, bookings: 10, aiResponses: 50, conversionRate: 5, autoAttendanceRate: 80 },
            daily: [{ date: '2024-01-01', bookings: 1, messages: 10 }],
            bookingStatus: { CONFIRMED: 5, PENDING: 3, CANCELLED: 2, NO_SHOW: 0 },
            funnel: { service_selected: 100, provider_selected: 80, date_selected: 60, booking_completed: 40 },
            peakHours: []
        },
        loading: false,
        error: null
    }),
    usePlanUsage: () => ({
        usage: { bookingsThisMonth: 5, limit: 100, tokensIA: 1000, bookings: 10, messages: 100 },
        loading: false,
        error: null
    }),
}));

jest.mock('../../../hooks/usePlanFeatures', () => ({
    usePlanFeatures: () => ({
        plan: 'PRO',
        maxBookings: 1000,
        maxMessages: 5000,
        features: { hasAnalytics: true, hasCustomDomains: true },
        loading: false,
        error: null
    }),
}));

jest.mock('../../../context/TenantContext', () => ({
    useTenant: () => ({
        tenant: { slug: 'tenant1' },
    }),
}));

// Mock components
jest.mock('../../../components/dashboard/AppWidgetSummary', () => function MockAppWidgetSummary() { return <div data-testid="summary-card">AppWidgetSummary</div>; });
jest.mock('../../../components/dashboard/AppWebsiteVisits', () => function MockAppWebsiteVisits() { return <div data-testid="visits-card">AppWebsiteVisits</div>; });
jest.mock('../../../components/dashboard/AppCurrentVisits', () => function MockAppCurrentVisits() { return <div data-testid="current-card">AppCurrentVisits</div>; });
jest.mock('../../../components/dashboard/AppPlanUsage', () => function MockAppPlanUsage() { return <div data-testid="usage-card">AppPlanUsage</div>; });
jest.mock('../../../components/dashboard/FunnelChart', () => function MockFunnelChart() { return <div data-testid="funnel-card">FunnelChart</div>; });
jest.mock('../../../components/dashboard/PeakHoursHeatmap', () => function MockPeakHoursHeatmap() { return <div data-testid="heatmap-card">PeakHoursHeatmap</div>; });
jest.mock('../../../components/common/UpgradeModal', () => function MockUpgradeModal() { return <div data-testid="update-modal">UpgradeModal</div>; });

describe('DashboardPage', () => {
    it('renders dashboard components', async () => {
        render(<DashboardPage />);
        // Use findAllByTestId to handle multiple summaries and timing
        const elements = await screen.findAllByTestId('summary-card');
        expect(elements.length).toBeGreaterThan(0);
    });
});
