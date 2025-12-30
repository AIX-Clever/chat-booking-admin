'use client';

import React from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTenant } from '../context/TenantContext';

const PLAN_LEVELS: Record<string, number> = {
    'LITE': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
};

interface PlanGuardProps {
    children: React.ReactNode;
    minPlan: 'LITE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
    featureName?: string;
}

export default function PlanGuard({ children, minPlan, featureName = 'This feature' }: PlanGuardProps) {
    const { tenant, loading } = useTenant();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const currentPlan = tenant?.plan || 'LITE';
    const currentLevel = PLAN_LEVELS[currentPlan] || 1; // Default to LITE level if unknown
    const requiredLevel = PLAN_LEVELS[minPlan];

    if (currentLevel < requiredLevel) {
        return (
            <Box sx={{
                position: 'relative',
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {/* Background visual cue (optional blur effect could be added here if we rendered children behind) */}
                <Paper
                    elevation={3}
                    sx={{
                        p: 5,
                        textAlign: 'center',
                        maxWidth: 500,
                        borderRadius: 4,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                        border: '1px solid #e5e7eb'
                    }}
                >
                    <Box sx={{
                        display: 'inline-flex',
                        p: 2,
                        borderRadius: '50%',
                        bgcolor: 'primary.50',
                        mb: 3
                    }}>
                        <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Unlock Premium Capabilities
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {featureName} is available exclusively on the <strong>{minPlan}</strong> plan and above.
                        Upgrade to access advanced automation and AI features.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AutoAwesomeIcon />}
                        href="/settings?tab=ai" // Or trigger upgrade modal
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        Upgrade to {minPlan}
                    </Button>
                </Paper>
            </Box>
        );
    }

    return <>{children}</>;
}
