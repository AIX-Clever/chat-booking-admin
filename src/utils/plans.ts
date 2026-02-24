
export interface PlanMetadata {
    id: string;
    name: string;
    capacity: number;
    price: number;
    currency: string;
    features: string[];
}

export const PLANS: Record<string, PlanMetadata> = {
    'LITE': {
        id: 'LITE',
        name: 'Plan LITE',
        capacity: 1,
        price: 9990,
        currency: 'CLP',
        features: ['1 Profesional', '50 Reservas/mes', 'Marca de agua Lucia']
    },
    'PRO': {
        id: 'PRO',
        name: 'Plan PRO',
        capacity: 5,
        price: 29990,
        currency: 'CLP',
        features: ['Hasta 5 Profesionales', '200 Reservas/mes', 'Sin marca de agua']
    },
    'BUSINESS': {
        id: 'BUSINESS',
        name: 'Plan BUSINESS',
        capacity: 20,
        price: 89990,
        currency: 'CLP',
        features: ['Hasta 20 Profesionales', '1.000 Reservas/mes', 'IA NLP / NLP Soportado']
    }
};

export const getPlanDetails = (planId?: string) => {
    const normalizedId = (planId || 'LITE').toUpperCase();
    return PLANS[normalizedId] || PLANS['LITE'];
};
