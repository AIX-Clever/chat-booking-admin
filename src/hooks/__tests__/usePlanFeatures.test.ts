import { renderHook } from '@testing-library/react';
import { usePlanFeatures } from '../usePlanFeatures';
import { useTenant } from '../../context/TenantContext';

// Mock the context
jest.mock('../../context/TenantContext', () => ({
    useTenant: jest.fn()
}));

describe('usePlanFeatures hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return LITE limits by default', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: null });

        const { result } = renderHook(() => usePlanFeatures());

        expect(result.current.plan).toBe('LITE');
        expect(result.current.canUseAI).toBe(false);
        expect(result.current.maxUsers).toBe(1);
    });

    it('should return PRO limits correctly', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'PRO' } });

        const { result } = renderHook(() => usePlanFeatures());

        expect(result.current.plan).toBe('PRO');
        expect(result.current.maxUsers).toBe(5);
        expect(result.current.canUseAI).toBe(false);
    });

    it('should return BUSINESS limits and allow AI', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'BUSINESS' } });

        const { result } = renderHook(() => usePlanFeatures());

        expect(result.current.plan).toBe('BUSINESS');
        expect(result.current.canUseAI).toBe(true);
    });

    it('should correctly determine isUsageHigh', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'LITE' } });

        // LITE msgs limit is 500. 80% is 400.
        const { result: lowUsage } = renderHook(() => usePlanFeatures({ messages: 100, bookings: 10 }));
        expect(lowUsage.current.isUsageHigh).toBe(false);

        const { result: highUsage } = renderHook(() => usePlanFeatures({ messages: 401, bookings: 10 }));
        expect(highUsage.current.isUsageHigh).toBe(true);
    });

    it('should correctly determine canInviteUser', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'PRO' } });

        // PRO users limit is 5.
        const { result: canInvite } = renderHook(() => usePlanFeatures({ messages: 0, bookings: 0, users: 4 }));
        expect(canInvite.current.canInviteUser).toBe(true);

        const { result: cannotInvite } = renderHook(() => usePlanFeatures({ messages: 0, bookings: 0, users: 5 }));
        expect(cannotInvite.current.canInviteUser).toBe(false);
    });
});
