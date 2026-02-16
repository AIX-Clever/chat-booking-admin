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
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import UpgradeModal from '../../components/common/UpgradeModal';
import { useState, useEffect } from 'react';

// Icons
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventIcon from '@mui/icons-material/Event';


export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const [hasMounted, setHasMounted] = useState(false);
    useTenant();
    const { metrics, error: metricsError } = useDashboardMetrics();
    const { usage } = usePlanUsage();

    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const planFeatures = usePlanFeatures();

    const planName = planFeatures.plan;

    // Use hasMounted to avoid hydration mismatch with local formatting
    const weekLabels = hasMounted
        ? (metrics?.daily.map(d => new Date(d.date).toLocaleDateString()) || [])
        : [];

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const chartSeries = [
        {
            name: t('planMetrics.bookings'),
            type: 'column',
            fill: 'solid',
            data: metrics?.daily.map(d => d.bookings) || [],
        },
        {
            name: t('planMetrics.messages'),
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
            limit: planFeatures.plan === 'ENTERPRISE' ? 5000000 : planFeatures.plan === 'BUSINESS' ? 500000 : 100000,
            color: 'warning' as const
        },
        {
            label: t('planMetrics.bookings'),
            usage: usage?.bookings || 0,
            limit: planFeatures.maxBookings,
            color: 'primary' as const
        },
        {
            label: t('planMetrics.messages'),
            usage: usage?.messages || 0,
            limit: planFeatures.maxMessages,
            color: 'info' as const
        },
    ].filter(item => item.limit > 0); // Hide metrics not applicable to the plan

    // Calculate hours saved (assuming 5 minutes per booking handled by AI)
    const hoursSaved = Math.round((metrics?.summary.aiResponses || 0) * 5 / 60);

    return (
        <>
            <Typography variant="h4" sx={{ mb: 5 }}>
                {hasMounted ? `${t('welcome')} 👋` : ''}
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

            {/* Upgrade Modal */}
            <UpgradeModal
                open={upgradeOpen}
                onClose={() => setUpgradeOpen(false)}
                feature="USAGE"
                currentPlan={planName}
            />
        </>
    );
}
