import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface ActionRequiredGuardProps {
    children: React.ReactNode;
    condition: boolean;
    title: string;
    message: string;
    icon?: React.ReactNode;
}

export default function ActionRequiredGuard({
    children,
    condition,
    title,
    message,
    icon = <InfoIcon sx={{ fontSize: 48, color: 'primary.main' }} />
}: ActionRequiredGuardProps) {
    if (condition) {
        return <>{children}</>;
    }

    return (
        <Box sx={{ position: 'relative', width: '100%', minHeight: 300 }}>
            {/* Blurred Content Background */}
            <Box sx={{
                filter: 'blur(8px)',
                opacity: 0.3,
                pointerEvents: 'none',
                userSelect: 'none',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}>
                {children}
            </Box>

            {/* Overlay Message Card */}
            <Box sx={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                p: 2
            }}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        maxWidth: 400,
                        textAlign: 'center',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    <Stack spacing={2} alignItems="center">
                        <Box sx={{
                            bgcolor: 'primary.50',
                            p: 2,
                            borderRadius: '50%',
                            display: 'flex'
                        }}>
                            {icon}
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                            {title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {message}
                        </Typography>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
