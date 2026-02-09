
import * as React from 'react';
import {
    Box,
    Typography,
    Chip,
    Grid,
    Card,
    Radio,
    Alert,
    Switch
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslations } from 'next-intl';
import PlanGuard from '../../../components/PlanGuard';

import { AI_MODES, PLAN_LEVELS } from '../../../constants/settings';

interface AiConfigTabProps {
    aiMode: string;
    setAiMode: (mode: string) => void;
    ragEnabled: boolean;
    setRagEnabled: (enabled: boolean) => void;
    currentPlan: string;
    onUpgradeClick: () => void;
}

export default function AiConfigTab({ aiMode, setAiMode, ragEnabled, setRagEnabled, currentPlan, onUpgradeClick }: AiConfigTabProps) {
    const t = useTranslations('settings.ai');

    const isPlanSufficient = (minPlan: string) => {
        return (PLAN_LEVELS[currentPlan] || 0) >= (PLAN_LEVELS[minPlan] || 0);
    };

    const handleSelectAiMode = (modeId: string, minPlan: string) => {
        if (isPlanSufficient(minPlan)) {
            setAiMode(modeId);
        } else {
            onUpgradeClick();
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mr: 2 }}>{t('intelligenceMode')}</Typography>
                <Chip label={t('currentPlan', { plan: currentPlan })} color="primary" variant="outlined" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t('description')}
            </Typography>

            <Grid container spacing={3}>
                {AI_MODES.map((mode) => {
                    const locked = !isPlanSufficient(mode.minPlan);
                    const active = aiMode === mode.id;
                    const modeKey = mode.id as 'fsm' | 'nlp' | 'agent';

                    return (
                        <Grid item xs={12} md={4} key={mode.id}>
                            <Card
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    borderColor: active ? 'primary.main' : 'divider',
                                    bgcolor: active ? 'primary.50' : (locked ? '#f9fafb' : 'background.paper'),
                                    transition: 'all 0.2s',
                                    opacity: locked ? 0.8 : 1,
                                    '&:hover': {
                                        borderColor: active ? 'primary.main' : 'primary.light',
                                        transform: locked ? 'none' : 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => handleSelectAiMode(mode.id, mode.minPlan)}
                            >
                                {locked && (
                                    <Chip
                                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                                        label={t('requiresUpgrade', { plan: mode.minPlan })}
                                        size="small"
                                        color="warning"
                                        sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
                                    />
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: locked ? 2 : 0 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color={locked ? 'text.secondary' : 'text.primary'}>
                                        {t(`modes.${modeKey}.name`)}
                                    </Typography>
                                    {!locked && <Radio checked={active} value={mode.id} size="small" inputProps={{ 'aria-label': mode.id }} />}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                                    {t(`modes.${modeKey}.description`)}
                                </Typography>
                                <Chip
                                    label={t(`plans.${mode.minPlan.toLowerCase()}`)}
                                    size="small"
                                    variant={mode.id === 'agent' ? 'filled' : 'outlined'}
                                    color={mode.id === 'agent' ? 'primary' : 'default'}
                                    disabled={locked}
                                />
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* RAG Toggle Section */}
            <Box sx={{ mt: 6 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>{t('knowledgeBase')}</Typography>
                <PlanGuard minPlan="ENTERPRISE" featureName="The Knowledge Base (RAG)" variant="overlay" upgradeFeature="AI">
                    <Card variant="outlined" sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {t('enableKnowledge')}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {t('knowledgeDescription')}
                                </Typography>
                            </Box>
                            <Switch
                                checked={ragEnabled}
                                onChange={(e) => setRagEnabled(e.target.checked)}
                                disabled={aiMode === 'fsm'} // Only enable for AI modes
                            />
                        </Box>
                        {aiMode === 'fsm' && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                {t('ragRequirement')}
                            </Alert>
                        )}
                    </Card>
                </PlanGuard>
            </Box>

            <Box sx={{ mt: 4, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Alert severity="info">
                    {t('changeNotice')}
                </Alert>
            </Box>
        </Box>
    );
}
