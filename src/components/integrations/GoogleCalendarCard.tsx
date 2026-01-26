import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    Stack,
    Chip
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { fetchAuthSession } from 'aws-amplify/auth';

interface GoogleCalendarCardProps {
    providerId: string;
    tenantId: string; // We might need to get this from session or context
    isConnected: boolean; // We will need to fetch this
    onDisconnect: () => void;
}

export default function GoogleCalendarCard({ providerId, tenantId, isConnected, onDisconnect }: GoogleCalendarCardProps) {

    const handleConnect = () => {
        const authUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;
        if (!authUrl) {
            alert('Google Auth URL not configured (NEXT_PUBLIC_GOOGLE_AUTH_URL)');
            return;
        }

        // Redirect to Lambda
        // We pass tenantId and providerId. 
        // Note: tenantId usually comes from context, but if we don't have it easily here, 
        // let's hope the Lambda can deduce it or we pass it from the parent page.
        // In ProvidersPage, we usually don't have explicit tenantId variable, 
        // it's embedded in the API token.
        // BUT for the public OAuth redirect, we need to pass it explicitly so the Lambda 
        // can encode it in the 'state'.

        // Strategy: Get tenantId from the user session or token? 
        // Actually, the simplest way is to fetch the current user/tenant info.
        // If we don't have it, we might need to improve the Props.

        if (!tenantId) {
            alert("Tenant ID missing");
            return;
        }

        const target = `${authUrl}/authorize?tenantId=${tenantId}&providerId=${providerId}`;
        window.location.href = target;
    };

    return (
        <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <AvatarIcon />
                        <Box>
                            <Typography variant="h6">Google Calendar</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sincroniza tus reservas y bloquea horarios ocupados automáticamente.
                            </Typography>
                        </Box>
                    </Stack>
                    <Box>
                        {!providerId ? (
                            <Typography variant="body2" sx={{
                                color: 'common.white',
                                fontStyle: 'italic',
                                bgcolor: 'primary.main',
                                p: 1.5,
                                borderRadius: 1,
                                textAlign: 'center'
                            }}>
                                Registra el profesional primero para conectar su calendario.
                            </Typography>
                        ) : isConnected ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label="Conectado"
                                    color="success"
                                    variant="outlined"
                                />
                                <Button color="error" onClick={onDisconnect}>
                                    Desconectar
                                </Button>
                            </Stack>
                        ) : (
                            <Button
                                variant="contained"
                                startIcon={<CalendarMonthIcon />}
                                onClick={handleConnect}
                                sx={{ bgcolor: '#4285F4', '&:hover': { bgcolor: '#3367D6' } }}
                            >
                                Conectar con Google
                            </Button>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function AvatarIcon() {
    return (
        <Box sx={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            bgcolor: '#E8F0FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <CalendarMonthIcon sx={{ color: '#4285F4' }} />
        </Box>
    );
}
