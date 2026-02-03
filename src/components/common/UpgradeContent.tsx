import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Paper
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupIcon from '@mui/icons-material/Group';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';

export type UpgradeFeature = 'AI' | 'TEAM' | 'USAGE' | 'WORKFLOW';

interface UpgradeContentProps {
    feature: UpgradeFeature;
    targetPlan: string;
    onUpgrade: () => void;
    loading?: boolean;
    onClose?: () => void; // If provided, shows Close icon and "Maybe Later" button
    showDismissButton?: boolean; // Explicit control over "Maybe Later" button
}

export default function UpgradeContent({
    feature,
    targetPlan,
    onUpgrade,
    loading = false,
    onClose,
    showDismissButton = true
}: UpgradeContentProps) {
    const t = useTranslations('upgradeModal');

    // Determine config dynamically based on feature and translations
    const config = useMemo(() => {
        const configs = {
            'AI': {
                title: t('unlockAi.title'),
                description: t('unlockAi.description'),
                icon: AutoAwesomeIcon,
                benefits: [t('unlockAi.benefit1'), t('unlockAi.benefit2'), t('unlockAi.benefit3')],
                color: '#8B5CF6' // Violet
            },
            'TEAM': {
                title: t('team.title'),
                description: t('team.description'),
                icon: GroupIcon,
                benefits: [t('team.benefit1'), t('team.benefit2'), t('team.benefit3')],
                color: '#10B981' // Emerald
            },
            'USAGE': {
                title: t('usage.title'),
                description: t('usage.description'),
                icon: SpeedIcon,
                benefits: [t('usage.benefit1'), t('usage.benefit2'), t('usage.benefit3')],
                color: '#F59E0B' // Amber
            },
            'WORKFLOW': {
                title: t('workflow.title'),
                description: t('workflow.description'),
                icon: AutoAwesomeIcon, // Reusing AI icon
                benefits: [t('workflow.benefit1'), t('workflow.benefit2'), t('workflow.benefit3')],
                color: '#3B82F6' // Blue
            }
        };
        return configs[feature];
    }, [feature, t]);

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'background.paper',
                width: '100%',
                maxWidth: '100%' // Container controls width
            }}
        >
            {/* Header / Graphic */}
            <Box sx={{
                bgcolor: config.color,
                color: 'white',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
            }}>
                {onClose && (
                    <IconButton
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}

                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 2,
                    mb: 2
                }}>
                    <config.icon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" align="center">
                    {config.title}
                </Typography>
                <Chip
                    label={t('common.upgradeTo', { plan: targetPlan })}
                    size="small"
                    sx={{
                        mt: 1,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: config.color,
                        fontWeight: 'bold'
                    }}
                />
            </Box>

            {/* Content Body */}
            <Box sx={{ p: 4 }}>
                <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ mb: 4 }}>
                    {config.description}
                </Typography>

                <Box sx={{
                    bgcolor: 'action.hover',
                    p: 3,
                    borderRadius: 2,
                    mb: 4
                }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.75rem' }}>
                        {t('common.whatYouGet', { plan: targetPlan })}
                    </Typography>
                    {config.benefits.map((benefit, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <CheckCircleIcon sx={{ color: config.color, fontSize: 20, mr: 1.5 }} />
                            <Typography variant="body2" fontWeight={500} color="text.primary">
                                {benefit}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {(onClose && showDismissButton) && (
                        <Button onClick={onClose} color="inherit" disabled={loading}>
                            {t('common.maybeLater')}
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        size="large"
                        onClick={onUpgrade}
                        disabled={loading}
                        sx={{
                            bgcolor: config.color,
                            '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
                            px: 4,
                            flexGrow: onClose ? 0 : 1 // Expand if no dismiss button
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : t('common.upgradeTo', { plan: targetPlan })}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
}
