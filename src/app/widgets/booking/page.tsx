'use client';

import React from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Stack, IconButton, InputAdornment } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useTenant } from '../../../context/TenantContext';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';

export default function BookingWidgetPage() {
    const t = useTranslations('widgets.booking');
    const { tenant } = useTenant();

    const publicUrl = `https://booking.holalucia.cl/${tenant?.slug || ''}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
    };

    const handleOpen = () => {
        window.open(publicUrl, '_blank');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                {t('title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('subtitle')}
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t('publicLink')}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                value={publicUrl}
                                variant="outlined"
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={handleCopy} edge="end">
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<LaunchIcon />}
                                onClick={handleOpen}
                                sx={{ minWidth: 150 }}
                            >
                                {t('openLink')}
                            </Button>
                        </Stack>
                    </Paper>

                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t('brandingTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('brandingSubtitle')}
                        </Typography>
                        {/* More options could be added here, gated with PlanGuard if they are PRO features */}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
