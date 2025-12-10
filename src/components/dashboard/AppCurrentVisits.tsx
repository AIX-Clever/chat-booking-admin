import React from 'react';
import { Card, CardHeader, Box, useTheme, styled } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
    title?: string;
    subheader?: string;
    chartData: {
        label: string;
        value: number;
        color: string;
    }[];
}

const StyledLegend = styled('ul')(({ theme }) => ({
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 0,
    gap: 8,
    margin: 3,
    fontSize: '0.875rem'
}));

const LegendItem = styled('li')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
}));

// Custom Legend Component
const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <StyledLegend>
            {payload.map((entry: any, index: number) => (
                <LegendItem key={`item-${index}`}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: entry.color }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{entry.payload.label}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{entry.value} bookings</span>
                    </Box>
                </LegendItem>
            ))}
        </StyledLegend>
    );
};

export default function AppCurrentVisits({ title, subheader, chartData }: Props) {
    const theme = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader title={title} subheader={subheader} />
            <Box sx={{ p: 3, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }} dir="ltr">
                {mounted && (
                    <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="label"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                content={renderLegend}
                            />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
                {!mounted && <Box sx={{ height: 320 }} />}
            </Box>
        </Card>
    );
}
