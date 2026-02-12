
import { useTenant } from '../context/TenantContext';

export interface PlanFeatures {
    canUseAI: boolean;
    canInviteUser: boolean;
    canCreateProvider: boolean;
    aiEnabled: boolean;
    maxUsers: number;
    maxMessages: number;
    maxBookings: number;
    maxProviders: number;
    currentUsers: number;
    currentMessages: number;
    currentBookings: number;
    currentProviders: number;
    isUsageHigh: boolean;
    plan: string;
}

const PLAN_LIMITS: Record<string, { ai: boolean; users: number; msgs: number; bookings: number; providers: number }> = {
    'LITE': { ai: false, users: 1, msgs: 500, bookings: 50, providers: 1 },
    'PRO': { ai: false, users: 5, msgs: 2000, bookings: 200, providers: 5 },
    'BUSINESS': { ai: true, users: 20, msgs: 10000, bookings: 1000, providers: 20 },
    'ENTERPRISE': { ai: true, users: 9999, msgs: 100000, bookings: 10000, providers: 100 }
};

export function usePlanFeatures(usage?: { messages: number; bookings: number; users?: number; providers?: number }): PlanFeatures {
    const { tenant } = useTenant();
    const plan = tenant?.plan || 'LITE';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['LITE'];

    const currentMessages = usage?.messages || 0;
    const currentBookings = usage?.bookings || 0;
    const currentUsers = usage?.users || 1;
    const currentProviders = usage?.providers || 0;

    const isUsageHigh =
        currentMessages > limits.msgs * 0.8 ||
        currentBookings > limits.bookings * 0.8 ||
        currentProviders > limits.providers * 0.8 ||
        (limits.users > 1 && currentUsers > limits.users * 0.8);

    return {
        canUseAI: limits.ai,
        canInviteUser: currentUsers < limits.users,
        canCreateProvider: currentProviders < limits.providers,
        aiEnabled: limits.ai,
        maxUsers: limits.users,
        maxMessages: limits.msgs,
        maxBookings: limits.bookings,
        maxProviders: limits.providers,
        currentUsers,
        currentMessages,
        currentBookings,
        currentProviders,
        isUsageHigh,
        plan
    };
}
