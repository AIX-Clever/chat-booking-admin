import { Card, CardHeader, CardContent, Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

interface FunnelChartProps {
    data: {
        service_selected: number;
        provider_selected: number;
        date_selected: number;
        booking_completed: number;
    };
}

export default function FunnelChart({ data }: FunnelChartProps) {
    const t = useTranslations('dashboard');

    const steps = [
        { label: t('funnel.serviceSelected'), value: data.service_selected, color: '#00B8D9' },
        { label: t('funnel.providerSelected'), value: data.provider_selected, color: '#FFAB00' },
        { label: t('funnel.dateSelected'), value: data.date_selected, color: '#FF5630' },
        { label: t('funnel.bookingCompleted'), value: data.booking_completed, color: '#00A76F' },
    ];

    const maxValue = Math.max(...steps.map(s => s.value), 1);

    return (
        <Card>
            <CardHeader title={t('funnel.title')} subheader={t('funnel.subtitle')} />
            <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {steps.map((step, index) => (
                        <Box key={index} sx={{ position: 'relative' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {step.label}
                                </Typography>
                                <Typography variant="body2">
                                    {step.value}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    height: 8,
                                    width: '100%',
                                    bgcolor: '#EDEFF1',
                                    borderRadius: 1,
                                    overflow: 'hidden'
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '100%',
                                        width: `${(step.value / maxValue) * 100}%`,
                                        bgcolor: step.color,
                                        borderRadius: 1,
                                        transition: 'width 0.5s ease-in-out'
                                    }}
                                />
                            </Box>
                            {index < steps.length - 1 && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        right: '50%',
                                        bottom: -20,
                                        color: 'text.secondary',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    ▼ {step.value > 0 ? Math.round((steps[index + 1].value / step.value) * 100) : 0}%
                                </Box>
                            )}
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}
