
import * as React from 'react';
import {
    Box,
    Typography,
    Chip,
    Grid,
    Card,
    Radio,
    Alert
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

// Could be imported from a constants file
const AI_MODES = [
    {
        id: 'fsm',
        name: 'FSM (Básico)',
        desc: 'Árbol de decisiones determinista. Ideal para flujos fijos y control total.',
        price: 'Included',
        minPlan: 'LITE'
    },
    {
        id: 'nlp',
        name: 'NLP Asistido',
        desc: 'Usa IA ligera para detectar intención y entidades, pero sigue reglas estrictas.',
        price: 'Low Cost',
        minPlan: 'PRO'
    },
    {
        id: 'agent',
        name: 'Agente Full AI',
        desc: 'Agente autónomo con razonamiento (Bedrock + Sonnet). Conversación natural.',
        price: 'High Performance',
        minPlan: 'BUSINESS'
    }
];

const PLAN_LEVELS: Record<string, number> = {
    'LITE': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
};

interface AiConfigTabProps {
    aiMode: string;
    setAiMode: (mode: string) => void;
    currentPlan: string;
    onUpgradeClick: () => void;
}

export default function AiConfigTab({ aiMode, setAiMode, currentPlan, onUpgradeClick }: AiConfigTabProps) {
    const isPlanSufficient = (minPlan: string) => {
        return PLAN_LEVELS[currentPlan] >= PLAN_LEVELS[minPlan];
    };

    const handleSelectAiMode = (mode: typeof AI_MODES[0]) => {
        if (isPlanSufficient(mode.minPlan)) {
            setAiMode(mode.id);
        } else {
            onUpgradeClick();
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ mr: 2 }}>Intelligence Mode</Typography>
                <Chip label={`Current Plan: ${currentPlan}`} color="primary" variant="outlined" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Select the AI model that powers your conversational agent. Higher tiers require advanced plans.
            </Typography>

            <Grid container spacing={3}>
                {AI_MODES.map((mode) => {
                    const locked = !isPlanSufficient(mode.minPlan);
                    const active = aiMode === mode.id;

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
                                onClick={() => handleSelectAiMode(mode)}
                            >
                                {locked && (
                                    <Chip
                                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                                        label={`Requires ${mode.minPlan}`}
                                        size="small"
                                        color="warning"
                                        sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
                                    />
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: locked ? 2 : 0 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color={locked ? 'text.secondary' : 'text.primary'}>
                                        {mode.name}
                                    </Typography>
                                    {!locked && <Radio checked={active} value={mode.id} size="small" />}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                                    {mode.desc}
                                </Typography>
                                <Chip
                                    label={mode.price}
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

            <Box sx={{ mt: 4, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Alert severity="info">
                    Changes to AI Mode generally apply instantly, but active conversations might finish their session with the previous model.
                </Alert>
            </Box>
        </Box>
    );
}
