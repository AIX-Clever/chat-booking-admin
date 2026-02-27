
import { renderHook } from '@testing-library/react';
import { usePlanFeatures } from '../usePlanFeatures';
import { useTenant } from '../../context/TenantContext';

// Mock useTenant
jest.mock('../../context/TenantContext', () => ({
    useTenant: jest.fn(),
}));

describe('usePlanFeatures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns LITE defaults when no tenant', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: null });
        const { result } = renderHook(() => usePlanFeatures());
        expect(result.current.plan).toBe('LITE');
        expect(result.current.canUseAI).toBe(false);
    });

    it('returns PRO features correctly', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'PRO' } });
        const { result } = renderHook(() => usePlanFeatures({ messages: 100, bookings: 50 }));
        expect(result.current.plan).toBe('PRO');
        expect(result.current.maxUsers).toBe(5);
        expect(result.current.isUsageHigh).toBe(false);
    });

    it('detects high usage for BUSINESS', () => {
        (useTenant as jest.Mock).mockReturnValue({ tenant: { plan: 'BUSINESS' } });
        // BUSINESS limit for messages is 10000. 8001 is > 80%.
        const { result } = renderHook(() => usePlanFeatures({ messages: 8001, bookings: 10 }));
        expect(result.current.isUsageHigh).toBe(true);
    });
});
