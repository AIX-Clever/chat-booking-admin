'use client';

import { Typography, Grid, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import AppWidgetSummary from '../../components/dashboard/AppWidgetSummary';
import AppWebsiteVisits from '../../components/dashboard/AppWebsiteVisits';
import AppCurrentVisits from '../../components/dashboard/AppCurrentVisits';
import AppPlanUsage from '../../components/dashboard/AppPlanUsage';
import { useDashboardMetrics, usePlanUsage } from '../../hooks/useDashboardMetrics';
import { useTenant } from '../../context/TenantContext';
import FunnelChart from '../../components/dashboard/FunnelChart';
import PeakHoursHeatmap from '../../components/dashboard/PeakHoursHeatmap';

// Icons
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventIcon from '@mui/icons-material/Event';

// Plan limits by plan type (these could come from tenant settings)
const PLAN_LIMITS: Record<string, { tokensIA: number; bookings: number; apiCalls: number }> = {
    FREE: { tokensIA: 0, bookings: 50, apiCalls: 500 },
    LITE: { tokensIA: 0, bookings: 50, apiCalls: 500 }, // No AI, matched with usage hook
    PRO: { tokensIA: 20000, bookings: 500, apiCalls: 10000 },
    BUSINESS: { tokensIA: 100000, bookings: 5000, apiCalls: 100000 },
    ENTERPRISE: { tokensIA: 1000000, bookings: 50000, apiCalls: 1000000 },
};

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { tenant } = useTenant();
    const { metrics, error: metricsError } = useDashboardMetrics();
    const { usage } = usePlanUsage();

    const planName = tenant?.plan || 'LITE';
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS['LITE'];

    const weekLabels = metrics?.daily.map(d => new Date(d.date).toLocaleDateString()) || [];
    const chartSeries = [
        {
            name: t('metrics.bookings'),
            type: 'column',
            fill: 'solid',
            data: metrics?.daily.map(d => d.bookings) || [],
        },
        {
            name: t('metrics.messages'),
            type: 'area',
            fill: 'gradient',
            data: metrics?.daily.map(d => d.messages) || [],
        },
    ];

    const bookingStatusData = [
        { label: t('status.confirmed'), value: metrics?.bookingStatus?.CONFIRMED || 0, color: '#00AB55' },
        { label: t('status.pending'), value: metrics?.bookingStatus?.PENDING || 0, color: '#FFC107' },
        { label: t('status.cancelled'), value: metrics?.bookingStatus?.CANCELLED || 0, color: '#FF4842' },
        { label: t('status.noShow'), value: metrics?.bookingStatus?.NO_SHOW || 0, color: '#637381' },
    ];

    // Plan usage data
    const planLimitsData = [
        {
            label: t('planMetrics.tokensIA'),
            usage: usage?.tokensIA || 0,
            limit: limits.tokensIA,
            color: 'warning' as const
        },
        {
            label: t('planMetrics.bookings'),
            usage: usage?.bookings || 0,
            limit: limits.bookings,
            color: 'primary' as const
        },
        {
            label: t('planMetrics.messages'),
            usage: usage?.messages || 0,
            limit: limits.apiCalls,
            color: 'info' as const
        },
    ].filter(item => item.limit > 0); // Hide metrics not applicable to the plan

    // Calculate hours saved (assuming 5 minutes per booking handled by AI)
    const hoursSaved = Math.round((metrics?.summary.aiResponses || 0) * 5 / 60);

    return (
        <>
            <Typography variant="h4" sx={{ mb: 5 }}>
                {t('welcome')} 👋
            </Typography>

            {metricsError && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {t('metricsError')}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title={t('totalRevenue')}
                        total={Math.round(metrics?.summary.revenue || 0)}
                        color="primary"
                        icon={<PaidIcon fontSize="large" />}
                        chartData={metrics?.daily.slice(-9).map(d => d.bookings * 100) || [0, 0, 0, 0, 0, 0, 0, 0, 0]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title={t('hoursSaved')}
                        total={hoursSaved}
                        color="info"
                        icon={<AccessTimeIcon fontSize="large" />}
                        chartData={metrics?.daily.slice(-9).map(d => Math.ceil(d.messages * 5 / 60)) || [0, 0, 0, 0, 0, 0, 0, 0, 0]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title={t('conversionRate')}
                        total={Math.round(metrics?.summary.conversionRate || 0)}
                        color="warning"
                        icon={<TrendingUpIcon fontSize="large" />}
                        chartData={[0, 0, 0, 0, 0, 0, 0, 0, metrics?.summary.conversionRate || 0]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title={t('autoAttendance')}
                        total={Math.round(metrics?.summary.autoAttendanceRate || 0)}
                        color="success"
                        icon={<SmartToyIcon fontSize="large" />}
                        chartData={[0, 0, 0, 0, 0, 0, 0, 0, metrics?.summary.autoAttendanceRate || 0]}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={8}>
                    <AppWebsiteVisits
                        title={t('topServicesPerformance')}
                        subheader={`${t('period')}: ${metrics?.period || 'actual'}`}
                        chartData={{
                            labels: weekLabels,
                            series: chartSeries,
                        }}
                    />
                </Grid>


                <Grid item xs={12} md={6} lg={4}>
                    <AppCurrentVisits
                        title={t('bookingStatus')}
                        chartData={bookingStatusData}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <FunnelChart
                        data={metrics?.funnel || {
                            service_selected: 0,
                            provider_selected: 0,
                            date_selected: 0,
                            booking_completed: 0
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <PeakHoursHeatmap
                        data={metrics?.peakHours || []}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppPlanUsage
                        planName={`${planName} ${t('plan')}`}
                        limits={planLimitsData}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={8}>
                    <AppWidgetSummary
                        title={t('totalBookings')}
                        total={metrics?.summary.bookings || 0}
                        color="secondary"
                        icon={<EventIcon fontSize="large" />}
                        chartData={metrics?.daily.slice(-9).map(d => d.bookings) || [0, 0, 0, 0, 0, 0, 0, 0, 0]}
                    />
                </Grid>
            </Grid>
        </>
    );
}
