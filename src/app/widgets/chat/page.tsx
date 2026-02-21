'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, IconButton, Tabs, Tab, Alert, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslations } from 'next-intl';
import PlanGuard from '../../../components/PlanGuard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeIcon from '@mui/icons-material/Code';
import ChatIcon from '@mui/icons-material/Chat';
import { useTenant } from '../../../context/TenantContext';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function WebIntegrationPage() {
    const t = useTranslations('widgets.chat');
    const { tenant } = useTenant();
    const [value, setValue] = useState(0);
    const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_BOOKING_BASE_URL || 'https://agendar.holalucia.cl';
    // Use tenant.slug for iframe, tenant.id for widget script
    const publicUrl = `${baseUrl}/${tenant?.slug || ''}`;

    // Iframe Embed Code (Tab 1)
    const iframeCode = `<iframe src="${publicUrl}" width="100%" height="700" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>`;

    // Widget Script Code (Tab 2)
    const scriptCode = `<script src="https://widget.holalucia.cl/bundle.js" 
    data-tenant-id="${tenant?.tenantId || 'YOUR_TENANT_ID'}" 
    data-primary-color="#000000" 
    data-language="es">
</script>`;

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast could be added here
    };

    const handleLoadWidget = () => {
        if (!tenant?.tenantId) return;

        // In a real playground, we inject the script dynamically
        const script = document.createElement('script');
        script.src = 'https://widget.holalucia.cl/bundle.js';
        script.setAttribute('data-tenant-id', tenant.tenantId);
        script.setAttribute('data-primary-color', '#1976d2');
        script.setAttribute('data-language', 'es');
        script.id = 'lucia-widget-script';

        document.body.appendChild(script);
        setIsWidgetLoaded(true);
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                {t('title')} {/* Integración Web */}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('subtitle')}
            </Typography>

            <Paper sx={{ width: '100%', mb: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={handleChange} aria-label="integration tabs">
                        <Tab icon={<CodeIcon />} iconPosition="start" label="Botón de Reservas (Embed)" />
                        <Tab icon={<ChatIcon />} iconPosition="start" label="Asistente IA (Chat)" />
                    </Tabs>
                </Box>

                {/* TAB 1: EMBED (Available for PRO+) */}
                <CustomTabPanel value={value} index={0}>
                    <PlanGuard minPlan="PRO" featureName="Botón de Reserva (Embed)" variant="block">
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={8}>
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    <strong>Ideal para sitios web existentes.</strong> Incrusta tu perfil de reservas directamente en tu página (Wordpress, Wix, Squarespace) usando un iFrame.
                                </Alert>

                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Código de Incrustación
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Copia y pega este código HTML donde quieras que aparezca el formulario de reserva.
                                </Typography>

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'grey.900',
                                        color: 'grey.300',
                                        borderRadius: 1,
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        position: 'relative',
                                        border: '1px solid',
                                        borderColor: 'grey.800',
                                        overflowX: 'auto'
                                    }}
                                >
                                    {iframeCode}
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(iframeCode)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: 'grey.500',
                                            '&:hover': { color: 'primary.light' }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box sx={{ mt: 4 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Vista Previa (Playground)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Así es como se verá el formulario de reservas en tu sitio web:
                                    </Typography>
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 1,
                                            bgcolor: 'grey.100',
                                            borderRadius: 2,
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div dangerouslySetInnerHTML={{ __html: iframeCode }} />
                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </PlanGuard>
                </CustomTabPanel>

                {/* TAB 2: AI CHAT (Gated for BUSINESS) */}
                <CustomTabPanel value={value} index={1}>
                    <PlanGuard minPlan="BUSINESS" featureName="Asistente IA (Lucia)" variant="block" upgradeFeature="AI">
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={8}>
                                <Alert severity="success" sx={{ mb: 3 }}>
                                    <strong>Desbloquea el poder de la IA.</strong> Este widget no solo agenda, sino que responde preguntas sobre tus servicios y negocio usando tu Base de Conocimiento.
                                </Alert>

                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Script de Instalación
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Agrega este script en el <code>&lt;head&gt;</code> o antes del cierre del <code>&lt;body&gt;</code> de tu sitio web.
                                </Typography>

                                <Box
                                    sx={{
                                        p: 2,
                                        bgcolor: 'grey.900',
                                        color: 'grey.300',
                                        borderRadius: 1,
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        position: 'relative',
                                        border: '1px solid',
                                        borderColor: 'grey.800',
                                        overflowX: 'auto',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    {scriptCode}
                                    <IconButton
                                        size="small"
                                        onClick={() => handleCopy(scriptCode)}
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            color: 'grey.500',
                                            '&:hover': { color: 'primary.light' }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Box sx={{ mt: 5 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Prueba la IA (Playground)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Haz clic en el botón de abajo para activar a Lucia en esta página y probar cómo responde.
                                    </Typography>

                                    {!isWidgetLoaded ? (
                                        <Button
                                            variant="contained"
                                            size="large"
                                            startIcon={<PlayArrowIcon />}
                                            onClick={handleLoadWidget}
                                            sx={{
                                                py: 2,
                                                px: 4,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                fontSize: '1.1rem',
                                                boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                                            }}
                                        >
                                            Activar Asistente de Prueba
                                        </Button>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Alert severity="success" icon={false} sx={{ flexGrow: 1, borderRadius: 2 }}>
                                                🚀 <strong>¡Lucia está activa!</strong> Busca el icono del chat en la esquina inferior derecha de tu pantalla.
                                            </Alert>
                                            <Button
                                                variant="outlined"
                                                startIcon={<RestartAltIcon />}
                                                onClick={handleReload}
                                                size="small"
                                            >
                                                Reiniciar
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </PlanGuard>
                </CustomTabPanel>
            </Paper>
        </Box>
    );
}

