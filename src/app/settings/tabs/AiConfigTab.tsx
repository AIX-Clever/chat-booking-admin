
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
                {AI_MODES.filter(m => m.id !== 'agent').map((mode) => {
                    const locked = !isPlanSufficient(mode.minPlan);
                    const active = aiMode === mode.id;
                    const modeKey = mode.id as 'fsm' | 'nlp' | 'agent';

                    return (
                        <Grid item xs={12} md={6} key={mode.id}>
                            <Card
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    cursor: locked ? 'default' : 'pointer',
                                    position: 'relative',
                                    borderColor: active ? 'primary.main' : 'divider',
                                    bgcolor: active ? 'primary.50' : 'background.paper',
                                    transition: 'all 0.2s',
                                    opacity: locked ? 0.6 : 1,
                                    '&:hover': {
                                        borderColor: (active || locked) ? (active ? 'primary.main' : 'divider') : 'primary.light',
                                        transform: locked ? 'none' : 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => !locked && handleSelectAiMode(mode.id, mode.minPlan)}
                            >
                                {locked && (
                                    <Chip
                                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                                        label={t('requiresUpgrade', { plan: mode.minPlan })}
                                        size="small"
                                        color="default"
                                        variant="outlined"
                                        sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold', bgcolor: 'background.paper' }}
                                    />
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: locked ? 2 : 0 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color={locked ? 'text.secondary' : 'text.primary'}>
                                        {t(`modes.${modeKey}.name`)}
                                    </Typography>
                                    <Radio
                                        checked={active}
                                        value={mode.id}
                                        size="small"
                                        disabled={locked}
                                        inputProps={{ 'aria-label': mode.id }}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                                    {t(`modes.${modeKey}.description`)}
                                </Typography>
                                <Chip
                                    label={t(`plans.${mode.minPlan.toLowerCase()}`)}
                                    size="small"
                                    variant="outlined"
                                    color="default"
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
                <Card variant="outlined" sx={{ p: 3, opacity: !isPlanSufficient('BUSINESS') ? 0.7 : 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ pr: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color={!isPlanSufficient('BUSINESS') ? 'text.secondary' : 'text.primary'}>
                                    {t('enableKnowledge')}
                                </Typography>
                                {!isPlanSufficient('BUSINESS') && (
                                    <Chip size="small" icon={<LockIcon sx={{ fontSize: 14 }} />} label="Requiere BUSINESS" variant="outlined" />
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {t('knowledgeDescription')}
                            </Typography>
                        </Box>
                        <Switch
                            checked={ragEnabled && aiMode !== 'fsm' && isPlanSufficient('BUSINESS')}
                            onChange={(e) => {
                                if (isPlanSufficient('BUSINESS')) {
                                    setRagEnabled(e.target.checked);
                                }
                            }}
                            disabled={aiMode === 'fsm' || !isPlanSufficient('BUSINESS')}
                            color="primary"
                        />
                    </Box>
                    {aiMode === 'fsm' && isPlanSufficient('BUSINESS') && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            {t('ragRequirement')}
                        </Alert>
                    )}
                </Card>
            </Box>

            <Box sx={{ mt: 4, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Alert severity="info">
                    {t('changeNotice')}
                </Alert>
            </Box>
        </Box>
    );
}
