'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { GET_TENANT } from '../graphql/queries';

// Define types based on schema
export interface Tenant {
    tenantId: string;
    name: string;
    slug: string;
    plan: 'LITE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'; // Expanded based on known plans
    status: 'ACTIVE' | 'PENDING_PAYMENT' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
    settings?: string; // JSON string
    createdAt: string;
}

interface TenantContextValue {
    tenant: Tenant | null;
    loading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshTenant = async () => {
        setLoading(true);
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            if (!token) {
                setLoading(false);
                return;
            }

            const attributes = await fetchUserAttributes();
            // We keep attributes for frontend use if needed, but not for the API call

            const client = generateClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_TENANT,
                variables: {}, // No longer passing tenantId explicitly
                authMode: 'userPool',
                authToken: token
            });

            if (response.data && response.data.getTenant) {
                setTenant(response.data.getTenant);
            }
        } catch (err) {
            console.error('Error fetching tenant in context:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, loading, refreshTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

