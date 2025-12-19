'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import { GET_DASHBOARD_METRICS, GET_PLAN_USAGE } from '../graphql/queries';

const client = generateClient();

export interface DashboardSummary {
    revenue: number;
    bookings: number;
    messages: number;
    tokensIA: number;
    conversionsChat: number;
    aiResponses: number;
    conversionRate: number;
    autoAttendanceRate: number;
}

export interface DailyMetric {
    date: string;
    bookings: number;
    messages: number;
}

export interface TopService {
    serviceId: string;
    name: string;
    bookings: number;
}

export interface TopProvider {
    providerId: string;
    name: string;
    bookings: number;
}

export interface BookingStatusCounts {
    CONFIRMED: number;
    PENDING: number;
    CANCELLED: number;
    NO_SHOW: number;
}

export interface MetricError {
    type: string;
    count: number;
    lastOccurred?: string;
}

export interface DashboardMetrics {
    period: string;
    summary: DashboardSummary;
    daily: DailyMetric[];
    topServices: TopService[];
    topProviders: TopProvider[];
    bookingStatus: BookingStatusCounts;
    errors: MetricError[];
}

export interface PlanUsage {
    messages: number;
    bookings: number;
    tokensIA: number;
}

export function useDashboardMetrics() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await client.graphql({
                query: GET_DASHBOARD_METRICS,
                authMode: 'userPool'
            }) as { data: { getDashboardMetrics: DashboardMetrics } };

            setMetrics(response.data.getDashboardMetrics);
        } catch (err: unknown) {
            console.error('Error fetching dashboard metrics:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load metrics';
            setError(errorMessage);

            // Return mock data as fallback for new tenants
            setMetrics({
                period: new Date().toISOString().slice(0, 7),
                summary: {
                    revenue: 0,
                    bookings: 0,
                    messages: 0,
                    tokensIA: 0,
                    conversionsChat: 0,
                    aiResponses: 0,
                    conversionRate: 0,
                    autoAttendanceRate: 0,
                },
                daily: [],
                topServices: [],
                topProviders: [],
                bookingStatus: {
                    CONFIRMED: 0,
                    PENDING: 0,
                    CANCELLED: 0,
                    NO_SHOW: 0,
                },
                errors: [],
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return { metrics, loading, error, refetch: fetchMetrics };
}

export function usePlanUsage() {
    const [usage, setUsage] = useState<PlanUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsage = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await client.graphql({
                query: GET_PLAN_USAGE,
                authMode: 'userPool'
            }) as { data: { getPlanUsage: PlanUsage } };

            setUsage(response.data.getPlanUsage);
        } catch (err: unknown) {
            console.error('Error fetching plan usage:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load usage';
            setError(errorMessage);

            // Return empty usage as fallback
            setUsage({ messages: 0, bookings: 0, tokensIA: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    return { usage, loading, error, refetch: fetchUsage };
}
