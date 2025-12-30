'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
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
            // 1. Get current authenticated user's tenantId
            // We rely on backend resolving it from identity, OR we pass it if we have it.
            // But waiting for Auth attributes is safer to ensure we are logged in.
            // However, the Amplify generateClient with userPool auth should handle the identity.
            // The backend resolver uses identity.username / sub. 
            // Previous code in MainLayout fetched 'custom:tenantId'. 
            // Let's try to fetch attributes first to fail fast if not auth.

            // Note: MainLayout handles redirect if not auth. Here we just gracefully return null or load.

            const client = generateClient();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: null } // Let backend infer from Auth context
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
