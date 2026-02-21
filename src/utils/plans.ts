
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
        capacity: 4,
        price: 95200, // $95.200
        currency: 'CLP',
        features: ['Hasta 4 atenciones simultáneas', 'Soporte básico', 'Widget de reservas']
    },
    'PRO': {
        id: 'PRO',
        name: 'Plan PRO',
        capacity: 10,
        price: 189990,
        currency: 'CLP',
        features: ['Hasta 10 atenciones', 'Soporte prioritario', 'Personalización avanzada']
    },
    'BUSINESS': {
        id: 'BUSINESS',
        name: 'Plan EMPRESAS',
        capacity: 50,
        price: 450000,
        currency: 'CLP',
        features: ['Multisucursal', 'API Access', 'Account Manager']
    }
};

export const getPlanDetails = (planId?: string) => {
    const normalizedId = (planId || 'LITE').toUpperCase();
    return PLANS[normalizedId] || PLANS['LITE'];
};
