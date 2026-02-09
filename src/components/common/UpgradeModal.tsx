import React, { useState } from 'react';
import { Dialog } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { SUBSCRIBE } from '../../graphql/queries';
import UpgradeContent, { UpgradeFeature } from './UpgradeContent';
import { navigateTo, getCurrentUrl } from '../../utils/navigation';

const client = generateClient();

// Re-export for compatibility
export type { UpgradeFeature };

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    feature: UpgradeFeature;
    currentPlan: string;
}

export default function UpgradeModal({ open, onClose, feature, currentPlan }: UpgradeModalProps) {
    const [loading, setLoading] = useState(false);

    // Determine target plan based on current (Simple logic for now)
    const targetPlan = currentPlan === 'LITE' ? 'PRO' : 'BUSINESS';

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const attrs = await fetchUserAttributes();
            const email = attrs.email;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: SUBSCRIBE,
                variables: {
                    planId: targetPlan.toLowerCase(), // 'pro' or 'business'
                    email: email,
                    backUrl: getCurrentUrl()
                }
            });

            const initPoint = response.data?.subscribe?.initPoint;
            if (initPoint) {
                navigateTo(initPoint);
            } else {
                console.error("No initPoint returned from subscription");
            }

        } catch (error) {
            console.error("Error creating subscription:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: 'transparent', // Let UpgradeContent handle bg
                    boxShadow: 'none' // Avoid double shadow
                }
            }}
        >
            <UpgradeContent
                feature={feature}
                targetPlan={targetPlan}
                onUpgrade={handleUpgrade}
                loading={loading}
                onClose={onClose}
                showDismissButton={true}
            />
        </Dialog>
    );
}
