import React, { useState } from 'react';
import { Card, Box, Typography, LinearProgress, Stack, Chip, useTheme, alpha, Button } from '@mui/material';
import { useTranslations } from 'next-intl';
import UpgradeModal from '../common/UpgradeModal';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

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
    const t = useTranslations('dashboard');
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Check if any limit is above 80%
    const isHighUsage = limits.some(l => (l.usage / l.limit) > 0.8);

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{t('planUsage')}</Typography>
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

            <Stack spacing={3} sx={{ p: 3, pt: 0, flexGrow: 1 }}>
                {limits.map((limit) => (
                    <Box key={limit.label}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                                {limit.label}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {((limit.usage / limit.limit) * 100).toFixed(0)}%
                            </Typography>
                        </Stack>

                        <LinearProgress
                            variant="determinate"
                            value={Math.min((limit.usage / limit.limit) * 100, 100)}
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
                ))}
            </Stack>

            {isHighUsage && (
                <Box sx={{ p: 3, pt: 0 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        startIcon={<TrendingUpIcon />}
                        onClick={() => setUpgradeModalOpen(true)}
                    >
                        Upgrade for Capacity
                    </Button>
                </Box>
            )}

            <UpgradeModal
                open={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                feature="USAGE"
                currentPlan={planName.split(' ')[0]} // Extract pure plan name
            />
        </Card>
    );
}
