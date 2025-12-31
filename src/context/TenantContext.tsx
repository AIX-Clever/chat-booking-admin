'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { GET_TENANT } from '../graphql/queries';

// Define types based on schema
export interface Tenant {
    tenantId: string;
    name: string;
    plan: 'LITE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'; // Expanded based on known plans
    settings?: string; // JSON string
    createdAt: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshTenant = async () => {
        try {
            let token: string | undefined;
            try {
                const session = await fetchAuthSession();
                // User Pool Auth often requires ID Token for identity claims
                token = session.tokens?.idToken?.toString();
            } catch (authErr) {
                console.warn('Failed to get auth session for TenantContext:', authErr);
            }

            if (!token) {
                // Warning only, let the query try (it might fail or use other auth if configured)
            }

            const client = generateClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: null },
                authMode: 'userPool',
                authToken: token // Explicitly passing ID token
            });

            if (response.data && response.data.getTenant) {
                setTenant(response.data.getTenant);
            }
        } catch (error) {
            console.error('Error fetching tenant context:', error);
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
