import React from 'react';
import { Card, CardHeader, Box, Typography, LinearProgress, Stack, Chip, useTheme, alpha } from '@mui/material';

interface Limit {
    label: string;
    usage: number;
    limit: number;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

interface Props {
    planName: string;
    limits: Limit[];
}

export default function AppPlanUsage({ planName, limits }: Props) {
    const theme = useTheme();

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Uso del Plan</Typography>
                <Chip
                    label={planName}
                    color="primary"
                    variant="filled"
                    size="small"
                    sx={{
                        borderRadius: 1,
                        fontWeight: 'bold',
                        backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        color: theme.palette.primary.dark,
                    }}
                />
            </Box>

            <Stack spacing={3} sx={{ p: 3, pt: 0 }}>
                {limits.map((limit) => {
                    const percent = (limit.usage / limit.limit) * 100;

                    return (
                        <Box key={limit.label}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                    {limit.label}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {percent.toFixed(0)}%
                                </Typography>
                            </Stack>

                            <LinearProgress
                                variant="determinate"
                                value={percent}
                                color={limit.color}
                                sx={{
                                    height: 8,
                                    borderRadius: 1, // Rounded corners for track
                                    bgcolor: alpha(theme.palette[limit.color].main, 0.16), // Softer background track
                                }}
                            />

                            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'right', color: 'text.disabled' }}>
                                {limit.usage.toLocaleString()} / {limit.limit.toLocaleString()}
                            </Typography>
                        </Box>
                    );
                })}
            </Stack>
        </Card>
    );
}
