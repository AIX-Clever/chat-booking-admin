import React from 'react';
import { Card, Typography, Box, useTheme, alpha } from '@mui/material';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface Props {
    title: string;
    total: number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
    percent?: number;
    chartData?: number[];
}

export default function AppWidgetSummary({ title, total, icon, color = 'primary', chartData = [] }: Props) {
    const theme = useTheme();

    // Map 'color' prop to actual theme palette color
    const themeColor = theme.palette[color].main; // Darker text for readability
    // For the background, we want it very light so the text pops, or use the minimal style which is often varying shades.
    // Converting the 'main' color to a background shade.
    const bgColor = alpha(themeColor, 0.16);
    const colorDark = theme.palette[color].dark;

    // Format chart data for Recharts
    const data = chartData.map((val, index) => ({ uv: val, index }));

    // Client-side rendering check
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Return a skeleton or just the structure without the chart to prevent hydration variance
        return (
            <Card
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 0,
                    color: colorDark, // Use darker color for text
                    bgcolor: bgColor,
                    borderRadius: 2,
                    height: 200,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="h3" sx={{ color: colorDark }}>{total.toLocaleString()}</Typography>
                        <Typography variant="subtitle2" sx={{ opacity: 0.72 }}>
                            {title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            borderRadius: '50%',
                            alignItems: 'center',
                            width: 48, // Slightly smaller icon container
                            height: 48,
                            justifyContent: 'center',
                            color: colorDark,
                            backgroundImage: `linear-gradient(135deg, ${alpha(colorDark, 0)} 0%, ${alpha(
                                colorDark,
                                0.24
                            )} 100%)`,
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 0,
                color: colorDark,
                bgcolor: bgColor,
                borderRadius: 2,
                height: 200, // Fixed height to ensure varying content doesn't misalign grid
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, position: 'relative' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{total.toLocaleString()}</Typography>
                    <Typography variant="subtitle2" sx={{ opacity: 0.64, fontWeight: 'medium' }}>
                        {title}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        borderRadius: '50%',
                        alignItems: 'center',
                        width: 48,
                        height: 48,
                        justifyContent: 'center',
                        color: colorDark,
                        backgroundImage: `linear-gradient(135deg, ${alpha(colorDark, 0)} 0%, ${alpha(
                            colorDark,
                            0.24
                        )} 100%)`,
                    }}
                >
                    {icon}
                </Box>
            </Box>

            {/* Chart Section - Explicitly placed at the bottom */}
            <Box sx={{ width: '100%', height: 80, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line type="natural" dataKey="uv" stroke={colorDark} strokeWidth={3} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Card>
    );
}
