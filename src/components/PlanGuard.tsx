'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useTenant } from '../context/TenantContext';
import UpgradeModal, { UpgradeFeature } from './common/UpgradeModal';

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
    upgradeFeature?: UpgradeFeature; // To pass to modal
    variant?: 'block' | 'overlay'; // New prop
}

export default function PlanGuard({
    children,
    minPlan,
    featureName = 'This feature',
    upgradeFeature = 'AI',
    variant = 'block'
}: PlanGuardProps) {
    const { tenant, loading } = useTenant();
    const [modalOpen, setModalOpen] = useState(false);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const currentPlan = tenant?.plan || 'LITE';
    const currentLevel = PLAN_LEVELS[currentPlan] || 1;
    const requiredLevel = PLAN_LEVELS[minPlan];

    if (currentLevel < requiredLevel) {
        if (variant === 'overlay') {
            return (
                <Box sx={{ position: 'relative', minHeight: 200 }}>
                    {/* Blurred Content */}
                    <Box sx={{ filter: 'blur(6px)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
                        {children}
                    </Box>

                    {/* Overlay Lock */}
                    <Box sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}>
                        <Paper
                            elevation={4}
                            sx={{
                                p: 3,
                                textAlign: 'center',
                                borderRadius: 3,
                                maxWidth: 400,
                                background: 'rgba(255, 255, 255, 0.95)',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: 'primary.50', mb: 2 }}>
                                <LockIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                            </Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {featureName} is locked
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Upgrade to {minPlan} to unlock this feature and more.
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AutoAwesomeIcon />}
                                onClick={() => setModalOpen(true)}
                            >
                                Unlock Feature
                            </Button>
                        </Paper>
                    </Box>
                    <UpgradeModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        feature={upgradeFeature}
                        currentPlan={currentPlan}
                    />
                </Box>
            );
        }

        // Default 'block' variant (replaces content)
        return (
            <Box sx={{
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
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
                    <Box sx={{ display: 'inline-flex', p: 2, borderRadius: '50%', bgcolor: 'primary.50', mb: 3 }}>
                        <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Unlock Premium Features
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        {featureName} is available on the {minPlan} plan.
                    </Typography>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => setModalOpen(true)}
                        sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    >
                        Upgrade to {minPlan}
                    </Button>
                </Paper>
                <UpgradeModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    feature={upgradeFeature}
                    currentPlan={currentPlan}
                />
            </Box>
        );
    }

    return <>{children}</>;
}
