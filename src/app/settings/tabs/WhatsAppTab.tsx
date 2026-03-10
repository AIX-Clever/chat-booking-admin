import * as React from 'react';
import {
    Box,
    Typography,
    Card,
    Switch,
    Button,
    Grid,
    Divider,
    Alert,
    Collapse,
    Chip
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkOffIcon from '@mui/icons-material/LinkOff';

// The Connected App SID is injected at build time via env var
const TWILIO_CONNECTED_APP_SID = process.env.NEXT_PUBLIC_TWILIO_CONNECTED_APP_SID || '';

interface WhatsAppTabProps {
    whatsappEnabled: boolean;
    setWhatsappEnabled: (enabled: boolean) => void;
    whatsappQuota: number;
    twilioPhoneNumber?: string;
    tenantId?: string;
    onSave: () => void;
}

export default function WhatsAppTab({
    whatsappEnabled,
    setWhatsappEnabled,
    whatsappQuota,
    twilioPhoneNumber,
    tenantId,
    onSave
}: WhatsAppTabProps) {
    const [showError, setShowError] = React.useState(false);
    const isConnected = !!twilioPhoneNumber;

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isTurningOn = e.target.checked;
        if (isTurningOn && whatsappQuota <= 0) {
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
            return;
        }
        setShowError(false);
        setWhatsappEnabled(isTurningOn);
    };

    const handleConnect = () => {
        if (!TWILIO_CONNECTED_APP_SID || !tenantId) {
            alert('Configuración de Twilio no disponible. Contacta al soporte de Hola Lucía.');
            return;
        }
        // Build Twilio OAuth URL
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: TWILIO_CONNECTED_APP_SID,
            state: tenantId,
            scope: 'offline_access',
        });
        const twilioAuthUrl = `https://www.twilio.com/authorize/${TWILIO_CONNECTED_APP_SID}?${params.toString()}`;
        window.location.href = twilioAuthUrl;
    };

    const handleDisconnect = () => {
        // Clear the phone number in parent state; user must save to persist
        // Disconnect is done by saving with empty twilioPhoneNumber in settings
        if (window.confirm('¿Deseas desconectar tu cuenta de WhatsApp Business? Esta acción desactivará el envío de mensajes desde tu número.')) {
            setWhatsappEnabled(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WhatsAppIcon color="success" sx={{ mr: 1, fontSize: 32 }} />
                <Typography variant="h6">Integración WhatsApp</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Configura las notificaciones de WhatsApp para tus clientes e incremente la tasa de asistencia
                a las citas.
            </Typography>

            {/* WABA Connection Status */}
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 0.5 }}>
                            Cuenta de WhatsApp Business
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Conecta tu número de WhatsApp Business para enviar recordatorios desde tu propio número.
                        </Typography>
                    </Box>
                    {isConnected ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Chip
                                icon={<CheckCircleIcon />}
                                label={twilioPhoneNumber}
                                color="success"
                                variant="outlined"
                            />
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<LinkOffIcon />}
                                onClick={handleDisconnect}
                            >
                                Desconectar
                            </Button>
                        </Box>
                    ) : (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<WhatsAppIcon />}
                            onClick={handleConnect}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Conectar WhatsApp Business
                        </Button>
                    )}
                </Box>
                {!isConnected && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Sin una cuenta conectada, los mensajes se enviarán desde el número compartido de <strong>Hola Lucía</strong>.
                        Conecta tu WABA para enviar desde tu propio número.
                    </Alert>
                )}
            </Card>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Habilitar Notificaciones
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Activar el envío automático de confirmaciones y recordatorios por WhatsApp.
                                </Typography>
                            </Box>
                            <Switch
                                checked={whatsappEnabled}
                                onChange={handleToggle}
                                color="success"
                            />
                        </Box>
                        <Collapse in={showError}>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <strong>Saldo insuficiente:</strong> Necesitas tener créditos en tu bolsa para habilitar esta opción.
                            </Alert>
                        </Collapse>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onSave}
                                startIcon={<Typography variant="button">💾</Typography>}
                            >
                                Guardar Opciones
                            </Button>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Bolsa de Créditos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Las notificaciones de WhatsApp se descuentan de tu bolsa de créditos pre-pago.
                        </Typography>

                        <Box sx={{
                            flexGrow: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            bgcolor: 'action.hover',
                            borderRadius: 2,
                            py: 3,
                            mb: 3
                        }}>
                            <Typography variant="h3" color={whatsappQuota > 0 ? "success.main" : "error.main"} fontWeight="bold">
                                {whatsappQuota ?? 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                mensajes disponibles
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                            Recargar Créditos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Elige el plan que mejor se adapte a tu clínica. Las recargas se acreditan por transferencia bancaria — envíanos el comprobante por WhatsApp.
                        </Typography>

                        {/* Package Cards */}
                        {[
                            {
                                name: 'Starter',
                                msgs: 100,
                                price: '$9.990',
                                coverage: 'Hasta 50 pacientes/mes',
                                detail: 'Ideal para clínicas con 1 profesional o menos de 70 citas al mes.',
                                color: 'text.primary',
                            },
                            {
                                name: 'Standard',
                                msgs: 300,
                                price: '$24.990',
                                coverage: 'Hasta 150 pacientes/mes',
                                detail: 'Para clínicas con 1–2 profesionales y agenda activa.',
                                color: 'primary.main',
                            },
                            {
                                name: 'Pro',
                                msgs: 600,
                                price: '$39.990',
                                coverage: 'Hasta 300 pacientes/mes',
                                detail: 'Para clínicas de 2–3 profesionales con alta demanda.',
                                color: 'success.main',
                            },
                        ].map((pkg) => (
                            <Box
                                key={pkg.name}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    px: 2,
                                    py: 1.5,
                                    mb: 1.5,
                                    gap: 1,
                                    flexWrap: 'wrap',
                                }}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                                        <Typography variant="subtitle2" fontWeight="bold" color={pkg.color}>
                                            {pkg.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            · {pkg.msgs} mensajes
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {pkg.coverage} · {pkg.detail}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {pkg.price}
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="success"
                                        startIcon={<WhatsAppIcon fontSize="small" />}
                                        onClick={() => {
                                            const msg = encodeURIComponent(
                                                `Hola, quiero recargar la bolsa ${pkg.name} (${pkg.msgs} mensajes - ${pkg.price}). Adjunto comprobante.`
                                            );
                                            window.open(`https://wa.me/56964264770?text=${msg}`, '_blank');
                                        }}
                                    >
                                        Comprar
                                    </Button>
                                </Box>
                            </Box>
                        ))}

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            * IVA incluido · 1 crédito = 1 mensaje WhatsApp · Confirmación + Recordatorio = 2 créditos por paciente
                        </Typography>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
