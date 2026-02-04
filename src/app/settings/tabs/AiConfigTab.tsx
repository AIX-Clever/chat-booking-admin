
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

// Could be imported from a constants file
const AI_MODES = [
    {
        id: 'fsm',
        name: 'FSM (Básico)',
        desc: 'Árbol de decisiones determinista. Ideal para flujos fijos y control total.',
        price: 'Plan LITE',
        minPlan: 'LITE'
    },
    {
        id: 'nlp',
        name: 'NLP Asistido',
        desc: 'Usa IA ligera para detectar intención y entidades, pero sigue reglas estrictas.',
        price: 'Plan BUSINESS',
        minPlan: 'BUSINESS'
    },
    {
        id: 'agent',
        name: 'Agente Full AI',
        desc: 'Agente autónomo con razonamiento (Bedrock + Sonnet). Conversación natural.',
        price: 'Plan ENTERPRISE',
        minPlan: 'ENTERPRISE'
    }
];

// ... (lines 42-137 unchanged)

{/* RAG Toggle Section */ }
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
        </Box >
    );
}
