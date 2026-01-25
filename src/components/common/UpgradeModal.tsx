```
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    IconButton
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupIcon from '@mui/icons-material/Group';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

export type UpgradeFeature = 'AI' | 'TEAM' | 'USAGE' | 'WORKFLOW';

interface UpgradeModalProps {
    open: boolean;
    onClose: () => void;
    feature: UpgradeFeature;
    currentPlan: string;
}

const FEATURE_CONFIG: Record<UpgradeFeature, {
    title: string;
    description: string;
    icon: React.ElementType;
    benefits: string[];
    color: string;
}> = {
    'AI': {
        title: 'Unlock AI Intelligence',
        description: 'Train your assistant with your own documents and let it handle complex questions automatically.',
        icon: AutoAwesomeIcon,
        benefits: ['Custom Knowledge Base', 'Smart RAG Responses', '24/7 Automated Support'],
        color: '#8B5CF6' // Violet
    },
    'TEAM': {
        title: 'Work Together',
        description: 'Scale your operations by inviting your team members to manage chats and bookings.',
        icon: GroupIcon,
        benefits: ['Up to 5 Team Members', 'Role-based Access', 'Shared Inbox'],
        color: '#10B981' // Emerald
    },
    'USAGE': {
        title: 'Increase Capacity',
        description: 'You are approaching your plan limits. Upgrade to keep growing without interruption.',
        icon: SpeedIcon,
        benefits: ['4x Booking Capacity', '4x Message Volume', 'Priority Support'],
        color: '#F59E0B' // Amber
    },
    'WORKFLOW': {
        title: 'Advanced Workflows',
        description: 'Create sophisticated conversation flows with AI-powered steps and logic.',
        icon: AutoAwesomeIcon, // Reusing AI icon
        benefits: ['AI Logic Steps', 'Complex Branching', 'Data Extraction'],
        color: '#3B82F6' // Blue
    }
};

export default function UpgradeModal({ open, onClose, feature, currentPlan }: UpgradeModalProps) {
    const config = FEATURE_CONFIG[feature];

    // Determine target plan based on current (Simple logic for now)
    const targetPlan = currentPlan === 'LITE' ? 'PRO' : 'BUSINESS';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header / Graphic */}
            <Box sx={{
                bgcolor: config.color,
                color: 'white',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
            }}>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
                >
                    <CloseIcon />
                </IconButton>

                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    p: 2,
                    mb: 2
                }}>
                    <config.icon sx={{ fontSize: 48 }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" align="center">
                    {config.title}
                </Typography>
                <Chip
                    label={`Upgrade to ${ targetPlan } `}
                    size="small"
                    sx={{
                        mt: 1,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        color: config.color,
                        fontWeight: 'bold'
                    }}
                />
            </Box>

            <DialogContent sx={{ pt: 4, pb: 2 }}>
                <Typography variant="body1" color="text.secondary" align="center" paragraph sx={{ mb: 4 }}>
                    {config.description}
                </Typography>

                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, textTransform: 'uppercase', color: 'text.secondary', fontSize: '0.75rem' }}>
                        What you get with {targetPlan}:
                    </Typography>
                    {config.benefits.map((benefit, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <CheckCircleIcon sx={{ color: config.color, fontSize: 20, mr: 1.5 }} />
                            <Typography variant="body2" fontWeight={500}>
                                {benefit}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
                <Button onClick={onClose} color="inherit" sx={{ mr: 1 }}>
                    Maybe Later
                </Button>
                <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                        window.open('https://billing.stripe.com/p/login/test', '_blank'); // Mock Portal URL
                        onClose();
                    }}
                    sx={{
                        bgcolor: config.color,
                        '&:hover': { bgcolor: config.color, filter: 'brightness(0.9)' },
                        px: 4
                    }}
                >
                    Upgrade to {targetPlan}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
