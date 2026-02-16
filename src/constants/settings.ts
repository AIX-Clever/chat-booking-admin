
export const AI_MODES = [
    {
        id: 'fsm',
        minPlan: 'BUSINESS'
    },
    {
        id: 'nlp',
        minPlan: 'BUSINESS'
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
