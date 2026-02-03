import React, { useState } from 'react';
import { Box, Paper, CircularProgress } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useTenant } from '../context/TenantContext';
import { UpgradeFeature } from './common/UpgradeModal'; // Type import
import UpgradeContent from './common/UpgradeContent';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { SUBSCRIBE } from '../graphql/queries';

const client = generateClient();

const PLAN_LEVELS: Record<string, number> = {
    'LITE': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
};

interface PlanGuardProps {
    children: React.ReactNode;
    minPlan: 'LITE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
    featureName?: string;
    upgradeFeature?: UpgradeFeature; // To pass to content
    variant?: 'block' | 'overlay';
}

export default function PlanGuard({
    children,
    minPlan,
    featureName = 'This feature',
    upgradeFeature = 'AI',
    variant = 'block'
}: PlanGuardProps) {
    const { tenant, loading: tenantLoading } = useTenant();
    const [upgrading, setUpgrading] = useState(false);

    if (tenantLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const currentPlan = tenant?.plan || 'LITE';
    const currentLevel = PLAN_LEVELS[currentPlan] || 1;
    const requiredLevel = PLAN_LEVELS[minPlan];

    const handleUpgrade = async () => {
        setUpgrading(true);
        try {
            const attrs = await fetchUserAttributes();
            const email = attrs.email;

            // Determine target plan. If minPlan is higher than current, use minPlan, else PRO. 
            // Actually, we usually want to upgrade to the REQUIRED plan.
            // But UpgradeModal logic was simply LITE->PRO. 
            // Let's use minPlan as the target since that's what unlocks the feature.
            const target = minPlan;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: SUBSCRIBE,
                variables: {
                    planId: target.toLowerCase(),
                    email: email,
                    backUrl: window.location.href
                }
            });

            const initPoint = response.data?.subscribe?.initPoint;
            if (initPoint) {
                window.location.href = initPoint;
            } else {
                console.error("No initPoint returned from subscription");
            }

        } catch (error) {
            console.error("Error creating subscription:", error);
        } finally {
            setUpgrading(false);
        }
    };

    if (currentLevel < requiredLevel) {
        // Shared content component
        const upgradeCard = (
            <Box sx={{ maxWidth: 500, width: '100%', m: 2 }}>
                <UpgradeContent
                    feature={upgradeFeature}
                    targetPlan={minPlan}
                    onUpgrade={handleUpgrade}
                    loading={upgrading}
                    showDismissButton={false}
                />
            </Box>
        );

        if (variant === 'overlay') {
            return (
                <Box sx={{ position: 'relative', minHeight: 400 }}>
                    {/* Blurred Content */}
                    <Box sx={{ filter: 'blur(8px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none', minHeight: '100%' }}>
                        {children}
                    </Box>

                    {/* Overlay Lock */}
                    <Box sx={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                    }}>
                        {upgradeCard}
                    </Box>
                </Box>
            );
        }

        // Default 'block' variant (replaces content)
        return (
            <Box sx={{
                height: '100%',
                minHeight: '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                {upgradeCard}
            </Box>
        );
    }

    return <>{children}</>;
}
