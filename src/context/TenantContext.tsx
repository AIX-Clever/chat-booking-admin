'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GET_TENANT } from '../graphql/queries';

// Define types based on schema
export interface Tenant {
    tenantId: string;
    name: string;
    slug: string;
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
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Tenant refresh timeout')), 10000);
            });

            // Race between the fetch and the timeout
            await Promise.race([
                (async () => {
                    let token: string | undefined;
                    try {
                        const session = await fetchAuthSession();
                        token = session.tokens?.idToken?.toString();
                    } catch (authErr) {
                        console.warn('Failed to get auth session for TenantContext:', authErr);
                    }

                    const client = generateClient();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const response: any = await client.graphql({
                        query: GET_TENANT,
                        variables: { tenantId: null },
                        authMode: 'userPool',
                        authToken: token
                    });

                    if (response.data && response.data.getTenant) {
                        setTenant(response.data.getTenant);
                    }
                })(),
                timeoutPromise
            ]);
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
