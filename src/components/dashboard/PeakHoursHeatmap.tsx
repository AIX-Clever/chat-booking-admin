import { Card, CardHeader, CardContent, Box } from '@mui/material';
import { useTranslations } from 'next-intl';

interface PeakHour {
    hour: number;
    bookings: number;
}

interface PeakHoursHeatmapProps {
    data: PeakHour[];
}

export default function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
    const t = useTranslations('dashboard');

    // Create full array of 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
        const found = data.find(p => p.hour === i);
        return { hour: i, value: found ? found.bookings : 0 };
    });

    const maxValue = Math.max(...hours.map(h => h.value), 1);

    const getColor = (value: number) => {
        const intensity = value / maxValue;
        // Simple blue-ish heatmap logic
        // Low: #E3F2FD (Blue 50), High: #1565C0 (Blue 800)
        if (value === 0) return '#F4F6F8'; // Empty
        if (intensity < 0.25) return '#E3F2FD';
        if (intensity < 0.5) return '#90CAF9';
        if (intensity < 0.75) return '#42A5F5';
        return '#1565C0';
    };

    return (
        <Card>
            <CardHeader title={t('peakHours.title')} subheader={t('peakHours.subtitle')} />
            <CardContent>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        gap: 1
                    }}
                >
                    {hours.map((stat) => (
                        <Box
                            key={stat.hour}
                            sx={{
                                aspectRatio: '1/1',
                                bgcolor: getColor(stat.value),
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                color: stat.value > 0.5 * maxValue ? 'white' : 'text.secondary',
                                cursor: 'default'
                            }}
                            title={`${stat.hour}:00 - ${stat.value} bookings`}
                        >
                            {stat.hour}h
                        </Box>
                    ))}
                </Box>
            </CardContent>
        </Card>
    );
}
