import React from 'react';
import { Card, CardHeader, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
    title?: string;
    subheader?: string;
    chartData: {
        labels: string[];
        series: {
            name: string;
            data: number[];
        }[];
    };
}

export default function AppWebsiteVisits({ title, subheader, chartData }: Props) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    // Transformation for Recharts: array of objects { name: label, series1: val, series2: val }
    const data = chartData.labels.map((label, index) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const point: Record<string, any> = { name: label };
        chartData.series.forEach((s) => {
            point[s.name] = s.data[index];
        });
        return point;
    });

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title={title} subheader={subheader} />
            <Box sx={{ p: 3, pb: 1 }} dir="ltr">
                {mounted && (
                    <ResponsiveContainer width="100%" height={364}>
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#919EAB' }} dy={10} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#919EAB' }} />
                            <Tooltip
                                cursor={{ fill: 'rgba(145, 158, 171, 0.08)' }}
                                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 8px 16px 0 rgba(145, 158, 171, 0.16)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: 20 }} />
                            {chartData.series.map((s, index) => (
                                <Bar
                                    key={s.name}
                                    dataKey={s.name}
                                    fill={index === 0 ? '#00A76F' : '#FFAB00'}
                                    barSize={10}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
                {!mounted && <Box sx={{ height: 364 }} />}
            </Box>
        </Card>
    );
}
