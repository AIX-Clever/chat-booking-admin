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
    Collapse
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

interface WhatsAppTabProps {
    whatsappEnabled: boolean;
    setWhatsappEnabled: (enabled: boolean) => void;
    whatsappQuota: number;
    onSave: () => void;
}

export default function WhatsAppTab({
    whatsappEnabled,
    setWhatsappEnabled,
    whatsappQuota,
    onSave
}: WhatsAppTabProps) {
    const [showError, setShowError] = React.useState(false);

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isTurningOn = e.target.checked;
        if (isTurningOn && whatsappQuota <= 0) {
            setShowError(true);
            // Auto hide error after 5s
            setTimeout(() => setShowError(false), 5000);
            return;
        }
        setShowError(false);
        setWhatsappEnabled(isTurningOn);
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
                                {whatsappQuota}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                mensajes disponibles
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                            Recarga de Créditos (Manual)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Por ahora, las recargas se realizan mediante transferencia bancaria. Transfiere el monto deseado a la siguiente cuenta y envíanos el comprobante por WhatsApp para acreditar tus mensajes.
                        </Typography>

                        <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                Banco: Santander<br />
                                Cuenta Corriente: 12345678-9<br />
                                RUT: 76.543.210-K<br />
                                Nombre: Hola Lucía SpA<br />
                                Email: hola@holalucia.cl
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            color="success"
                            fullWidth
                            startIcon={<WhatsAppIcon />}
                            onClick={() => {
                                window.open("https://wa.me/56964264770?text=Hola,%20quiero%20recargar%20mi%20bolsa%20de%20WhatsApp.%20Adjunto%20mi%20comprobante.", "_blank");
                            }}
                            sx={{ mt: 'auto' }}
                        >
                            Enviar Comprobante
                        </Button>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
