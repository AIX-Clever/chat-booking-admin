import React from 'react';
import { Chip, Tooltip, Box, Typography, alpha, useTheme } from '@mui/material';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

export type PlanType = 'LITE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

interface PlanBadgeProps {
    plan: PlanType;
    showIcon?: boolean;
}

const PlanBadge = ({ plan, showIcon = true }: PlanBadgeProps) => {
    const theme = useTheme();

    // Psychology: Lite is simple, Pro is "wow"
    const isPremium = plan === 'PRO' || plan === 'BUSINESS' || plan === 'ENTERPRISE';

    if (!isPremium) {
        return (
            <Tooltip title={`Plan ${plan}`}>
                <Chip
                    label={plan}
                    size="small"
                    variant="outlined"
                    sx={{
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                        borderColor: alpha(theme.palette.text.disabled, 0.3),
                        color: theme.palette.text.secondary,
                        '& .MuiChip-label': { px: 1 }
                    }}
                />
            </Tooltip>
        );
    }

    // Premium styling
    const gradients = {
        PRO: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', // Golden
        BUSINESS: 'linear-gradient(135deg, #00B8D9 0%, #0037FF 100%)', // Blue-Cyan
        ENTERPRISE: 'linear-gradient(135deg, #7635DC 0%, #300171 100%)', // Purple-Indigo
    };

    const shadows = {
        PRO: `0 2px 8px ${alpha('#FFA500', 0.4)}`,
        BUSINESS: `0 2px 8px ${alpha('#00B8D9', 0.4)}`,
        ENTERPRISE: `0 2px 8px ${alpha('#7635DC', 0.4)}`,
    };

    const gradient = gradients[plan as keyof typeof gradients] || gradients.PRO;
    const shadow = shadows[plan as keyof typeof shadows] || shadows.PRO;

    return (
        <Tooltip title={`Plan ${plan}`}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.2,
                    py: 0.3,
                    borderRadius: '12px',
                    background: gradient,
                    boxShadow: shadow,
                    border: '1px solid rgba(255,255,255,0.2)',
                    cursor: 'default',
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'scale(1.05)',
                    }
                }}
            >
                {showIcon && (
                    plan === 'PRO'
                        ? <DiamondIcon sx={{ fontSize: 13, color: 'white' }} />
                        : <WorkspacePremiumIcon sx={{ fontSize: 13, color: 'white' }} />
                )}
                <Typography
                    variant="caption"
                    sx={{
                        color: 'white',
                        fontWeight: 900,
                        letterSpacing: 0.5,
                        lineHeight: 1,
                        fontSize: '0.65rem',
                        textTransform: 'uppercase'
                    }}
                >
                    {plan}
                </Typography>
            </Box>
        </Tooltip>
    );
};

export default PlanBadge;
