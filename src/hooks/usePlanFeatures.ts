
import { useTenant } from '../context/TenantContext';

export interface PlanFeatures {
    canUseAI: boolean;
    canInviteUser: boolean;
    aiEnabled: boolean;
    maxUsers: number;
    maxMessages: number;
    maxBookings: number;
    currentUsers: number;
    currentMessages: number;
    currentBookings: number;
    isUsageHigh: boolean;
    plan: string;
}

const PLAN_LIMITS: Record<string, { ai: boolean; users: number; msgs: number; bookings: number }> = {
    'LITE': { ai: false, users: 1, msgs: 500, bookings: 50 },
    'PRO': { ai: true, users: 5, msgs: 2000, bookings: 200 },
    'BUSINESS': { ai: true, users: 1000, msgs: 10000, bookings: 1000 }, // Simplified
    'ENTERPRISE': { ai: true, users: 9999, msgs: 100000, bookings: 10000 }
};

export function usePlanFeatures(): PlanFeatures {
    const { tenant } = useTenant();
    const plan = tenant?.plan || 'LITE';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['LITE'];

    // Mock usage data for now (In real app, this should come from TenantContext or a separate API call)
    // We can assume user count is at least 1 (the owner)
    // If we had API access to user count, we would use it here.
    // For "Awareness", we can default to safe values or wait for the specific page to fetch usage.

    // However, for the "Invite User" button, we need to know the current user count.
    // Since we don't have it globally, we might pass it as an argument or just return the LIMIT.
    // Let's assume 1 user for global state, but specialized pages will verify the actual count.
    const currentUsers = 1;
    const currentMessages = 0;
    const currentBookings = 0;

    const isUsageHigh = (
        (currentMessages / limits.msgs > 0.8) ||
        (currentBookings / limits.bookings > 0.8)
    );

    return {
        canUseAI: limits.ai,
        canInviteUser: currentUsers < limits.users,
        aiEnabled: limits.ai,
        maxUsers: limits.users,
        maxMessages: limits.msgs,
        maxBookings: limits.bookings,
        currentUsers,
        currentMessages,
        currentBookings,
        isUsageHigh,
        plan
    };
}
