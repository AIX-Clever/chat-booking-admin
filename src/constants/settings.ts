
export const AI_MODES = [
    {
        id: 'fsm',
        minPlan: 'LITE'
    },
    {
        id: 'nlp',
        minPlan: 'PRO'
    },
    {
        id: 'agent',
        minPlan: 'ENTERPRISE'
    }
] as const;

export const PLAN_LEVELS: Record<string, number> = {
    'LITE': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
};
