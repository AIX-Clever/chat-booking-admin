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

interface MicrosoftCalendarCardProps {
    providerId: string;
    tenantId: string;
    isConnected: boolean;
    onDisconnect: () => void;
}

export default function MicrosoftCalendarCard({ providerId, tenantId, isConnected, onDisconnect }: MicrosoftCalendarCardProps) {

    const handleConnect = () => {
        const authUrl = process.env.NEXT_PUBLIC_MICROSOFT_AUTH_URL;
        if (!authUrl) {
            alert('Microsoft Auth URL not configured (NEXT_PUBLIC_MICROSOFT_AUTH_URL)');
            return;
        }

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
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: '#F3F2F1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CalendarMonthIcon sx={{ color: '#0078D4' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6">Outlook Calendar</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sincroniza tus reservas con Microsoft Outlook y bloquea slots ocupados.
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
                                sx={{ bgcolor: '#0078D4', '&:hover': { bgcolor: '#005A9E' } }}
                            >
                                Conectar con Outlook
                            </Button>
                        )}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}
