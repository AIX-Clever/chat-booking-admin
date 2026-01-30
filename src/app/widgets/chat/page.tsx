'use client';

import React from 'react';
import { Box, Typography, Paper, Grid, IconButton } from '@mui/material';
import { useTranslations } from 'next-intl';
import PlanGuard from '../../../components/PlanGuard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function ChatWidgetPage() {
    const t = useTranslations('widgets.chat');

    const scriptCode = `<script src="https://widget.holalucia.cl/bundle.js" data-tenant-id="YOUR_TENANT_ID"></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(scriptCode);
        // Add toast notification if available
    };

    return (
        <PlanGuard minPlan="PRO" featureName="AI Chat Bot (Lucia)" variant="overlay" upgradeFeature="AI">
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
                                {t('install')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {t('installSubtitle')}
                            </Typography>

                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: 'grey.900',
                                    color: 'grey.300',
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    position: 'relative',
                                    border: '1px solid',
                                    borderColor: 'grey.800'
                                }}
                            >
                                {scriptCode}
                                <IconButton
                                    size="small"
                                    onClick={handleCopy}
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        color: 'grey.500',
                                        '&:hover': { color: 'primary.light' }
                                    }}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </PlanGuard>
    );
}
