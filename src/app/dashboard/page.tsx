'use client';

import { Typography, Grid, CircularProgress, Box, Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import AppWidgetSummary from '../../components/dashboard/AppWidgetSummary';
import AppWebsiteVisits from '../../components/dashboard/AppWebsiteVisits';
import AppCurrentVisits from '../../components/dashboard/AppCurrentVisits';
import AppPlanUsage from '../../components/dashboard/AppPlanUsage';
import { useDashboardMetrics, usePlanUsage } from '../../hooks/useDashboardMetrics';

// Icons
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventIcon from '@mui/icons-material/Event';

// Plan limits by plan type (these could come from tenant settings)
const PLAN_LIMITS: Record<string, { tokensIA: number; bookings: number; apiCalls: number }> = {
    FREE: { tokensIA: 5000, bookings: 50, apiCalls: 1000 },
    PRO: { tokensIA: 20000, bookings: 500, apiCalls: 10000 },
    BUSINESS: { tokensIA: 100000, bookings: 5000, apiCalls: 100000 },
    ENTERPRISE: { tokensIA: 1000000, bookings: 50000, apiCalls: 1000000 },
};

export default function DashboardPage() {
    const t = useTranslations('dashboard');
    const { metrics, loading: metricsLoading, error: metricsError } = useDashboardMetrics();
    const { usage, loading: usageLoading } = usePlanUsage();

    // Get plan limits (default to FREE for demo)
    const planName = 'PRO'; // This should come from tenant data
    const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.FREE;

    if (metricsLoading || usageLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    // Prepare chart data from daily metrics
    const weekLabels = metrics?.daily.slice(-4).map(d => {
        const date = new Date(d.date);
        return `Semana ${Math.ceil(date.getDate() / 7)}`;
    }) || ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    const chartSeries = metrics?.topServices.slice(0, 2).map(service => ({
        name: service.name || 'Service',
        data: metrics.daily.slice(-4).map(() => Math.floor(service.bookings / 4) || 0),
    })) || [
            { name: 'Service 1', data: [0, 0, 0, 0] },
            { name: 'Service 2', data: [0, 0, 0, 0] },
        ];

    // If no chart data, use defaults
    if (chartSeries.length === 0) {
        chartSeries.push({ name: 'Sin datos', data: [0, 0, 0, 0] });
    }

    // Booking status for pie chart
    const bookingStatusData = metrics ? [
        { label: 'Confirmados', value: metrics.bookingStatus.CONFIRMED, color: '#00A76F' },
        { label: 'Pendientes', value: metrics.bookingStatus.PENDING, color: '#FFAB00' },
        { label: 'Cancelados', value: metrics.bookingStatus.CANCELLED, color: '#FF5630' },
        { label: 'No Show', value: metrics.bookingStatus.NO_SHOW, color: '#00B8D9' },
    ] : [
        { label: 'Confirmados', value: 0, color: '#00A76F' },
        { label: 'Pendientes', value: 0, color: '#FFAB00' },
        { label: 'Cancelados', value: 0, color: '#FF5630' },
        { label: 'No Show', value: 0, color: '#00B8D9' },
    ];

    // Plan usage data
    const planLimitsData = [
        {
            label: 'Tokens IA (Mensual)',
            usage: usage?.tokensIA || 0,
            limit: limits.tokensIA,
            color: 'warning' as const
        },
        {
            label: 'Reservas (Mensual)',
            usage: usage?.bookings || 0,
            limit: limits.bookings,
            color: 'primary' as const
        },
        {
            label: 'Mensajes',
            usage: usage?.messages || 0,
            limit: limits.apiCalls,
            color: 'info' as const
        },
    ];

    // Calculate hours saved (assuming 5 minutes per booking handled by AI)
    const hoursSaved = Math.round((metrics?.summary.aiResponses || 0) * 5 / 60);

    return (
        <>
            <Typography variant="h4" sx={{ mb: 5 }}>
                {t('welcome')} 👋
            </Typography>

            {metricsError && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    No se pudieron cargar las métricas. Mostrando datos iniciales.
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
                        title="Horas Ahorradas"
                        total={hoursSaved}
                        color="info"
                        icon={<AccessTimeIcon fontSize="large" />}
                        chartData={metrics?.daily.slice(-9).map(d => Math.ceil(d.messages * 5 / 60)) || [0, 0, 0, 0, 0, 0, 0, 0, 0]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Tasa de Conversión"
                        total={Math.round(metrics?.summary.conversionRate || 0)}
                        color="warning"
                        icon={<TrendingUpIcon fontSize="large" />}
                        chartData={[0, 0, 0, 0, 0, 0, 0, 0, metrics?.summary.conversionRate || 0]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Atención Automática"
                        total={Math.round(metrics?.summary.autoAttendanceRate || 0)}
                        color="success"
                        icon={<SmartToyIcon fontSize="large" />}
                        chartData={[0, 0, 0, 0, 0, 0, 0, 0, metrics?.summary.autoAttendanceRate || 0]}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={8}>
                    <AppWebsiteVisits
                        title="Top Services Performance"
                        subheader={`Período: ${metrics?.period || 'actual'}`}
                        chartData={{
                            labels: weekLabels,
                            series: chartSeries,
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppCurrentVisits
                        title="Estado de Reservas"
                        chartData={bookingStatusData}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppPlanUsage
                        planName={`${planName} Plan`}
                        limits={planLimitsData}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppWidgetSummary
                        title="Reservas del Mes"
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
