'use client';

import { Typography, Grid, Stack } from '@mui/material';
import AppWidgetSummary from '../../components/dashboard/AppWidgetSummary';
import AppWebsiteVisits from '../../components/dashboard/AppWebsiteVisits';
import AppCurrentVisits from '../../components/dashboard/AppCurrentVisits';
import AppPlanUsage from '../../components/dashboard/AppPlanUsage';

// Icons
import PaidIcon from '@mui/icons-material/Paid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export default function DashboardPage() {
    return (
        <>
            <Typography variant="h4" sx={{ mb: 5 }}>
                Hi, Welcome back 👋
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Ingresos Generados"
                        total={12450}
                        color="primary"
                        icon={<PaidIcon fontSize="large" />}
                        chartData={[500, 600, 800, 900, 1200, 1500, 1800, 2200, 2500]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Horas Ahorradas"
                        total={45}
                        color="info"
                        icon={<AccessTimeIcon fontSize="large" />}
                        chartData={[2, 3, 4, 5, 5, 6, 8, 8, 10]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Tasa de Conversión"
                        total={18}
                        color="warning"
                        icon={<TrendingUpIcon fontSize="large" />}
                        chartData={[10, 10, 12, 12, 15, 15, 16, 18, 18]}
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <AppWidgetSummary
                        title="Atención Automática"
                        total={92}
                        color="success"
                        icon={<SmartToyIcon fontSize="large" />}
                        chartData={[80, 82, 85, 88, 90, 90, 91, 92, 92]}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={8}>
                    <AppWebsiteVisits
                        title="Top Services Performance"
                        subheader="(+12%) than last month"
                        chartData={{
                            labels: [
                                'Week 1',
                                'Week 2',
                                'Week 3',
                                'Week 4',
                            ],
                            series: [
                                {
                                    name: 'Dermatology',
                                    data: [12, 18, 22, 28],
                                },
                                {
                                    name: 'Massage',
                                    data: [8, 15, 18, 22],
                                },
                            ],
                        }}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppCurrentVisits
                        title="Booking Status"
                        chartData={[
                            { label: 'Confirmed', value: 85, color: '#00A76F' },
                            { label: 'Pending', value: 45, color: '#FFAB00' },
                            { label: 'Cancelled', value: 12, color: '#FF5630' },
                            { label: 'No-Show', value: 10, color: '#00B8D9' },
                        ]}
                    />
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                    <AppPlanUsage
                        planName="LITE Plan"
                        limits={[
                            { label: 'Tokens IA (Mensual)', usage: 12500, limit: 20000, color: 'warning' },
                            { label: 'Reservas (Mensual)', usage: 68, limit: 100, color: 'primary' },
                            { label: 'API Calls', usage: 1540, limit: 10000, color: 'info' },
                        ]}
                    />
                </Grid>
            </Grid>
        </>
    );
}
