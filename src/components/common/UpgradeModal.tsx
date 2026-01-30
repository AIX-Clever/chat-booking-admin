import React, { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    IconButton,
    CircularProgress
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupIcon from '@mui/icons-material/Group';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslations } from 'next-intl';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { SUBSCRIBE } from '../../graphql/queries';

const client = generateClient();

export type UpgradeFeature = 'AI' | 'TEAM' | 'USAGE' | 'WORKFLOW';

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    feature: UpgradeFeature;
    currentPlan: string;
}

export default function UpgradeModal({ open, onClose, feature, currentPlan }: UpgradeModalProps) {
    const t = useTranslations('upgradeModal');
    const [loading, setLoading] = useState(false);

    // Determine target plan based on current (Simple logic for now)
    const targetPlan = currentPlan === 'LITE' ? 'PRO' : 'BUSINESS';

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

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const attrs = await fetchUserAttributes();
            const email = attrs.email;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: SUBSCRIBE,
                variables: {
                    planId: targetPlan.toLowerCase(), // 'pro' or 'business'
                    email: email,
                    backUrl: window.location.href
                }
            });

            const initPoint = response.data?.subscribe?.initPoint;
            if (initPoint) {
                window.location.href = initPoint;
            } else {
                console.error("No initPoint returned from subscription");
            }

        } catch (error) {
            console.error("Error creating subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
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
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
                >
                    <CloseIcon />
                </IconButton>

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

            <DialogContent sx={{ pt: 4, pb: 2 }}>
                <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ mb: 4 }}>
                    {config.description}
                </Typography>

                <Box sx={{
                    bgcolor: 'action.hover', // Changed from grey.50 for better dark mode support and contrast
                    p: 3,
                    borderRadius: 2
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
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                <Button onClick={onClose} color="inherit" sx={{ mr: 1 }} disabled={loading}>
                    {t('common.maybeLater')}
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleUpgrade}
                    disabled={loading}
                    sx={{
                        bgcolor: config.color,
                        '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
                        px: 4
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t('common.upgradeTo', { plan: targetPlan })}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
