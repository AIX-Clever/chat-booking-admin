'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Stack,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Container,
    Drawer,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { generateClient } from 'aws-amplify/api';
import { GET_PUBLIC_LINK_STATUS, LIST_PROVIDERS } from '../../graphql/queries';
import ClientOnly from '../../components/common/ClientOnly';
import { useTenant } from '../../context/TenantContext';

const DRAWER_WIDTH = 340;

interface ChecklistItem {
    item: string;
    status: 'COMPLETE' | 'MISSING' | 'RECOMMENDED';
    label: string;
    isRequired: boolean;
    actionUrl?: string; // New field for deep linking
}

interface PublicLinkStatus {
    isPublished: boolean;
    publishedAt: string | null;
    slug: string;
    publicUrl: string;
    completenessPercentage: number;
    completenessChecklist: ChecklistItem[];
}

export default function MyPage() {
    const { tenant } = useTenant();
    const [status, setStatus] = useState<PublicLinkStatus | null>(null);
    const [loading, setLoading] = useState(true);
    // Removed hasMounted state

    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);

    // State for professionals
    const [providers, setProviders] = useState<{ providerId: string, name: string }[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('all');

    const fetchProviders = async () => {
        try {
            const client = generateClient();
            const response = await client.graphql({
                query: LIST_PROVIDERS,
            }) as { data: { listProviders: { providerId: string, name: string }[] } };

            if (response.data?.listProviders) {
                setProviders(response.data.listProviders);
            }
        } catch (err) {
            console.error('Error fetching providers:', err);
        }
    };

    const fetchData = async (providerId: string = 'all') => {
        try {
            setLoading(true);
            setError(null);
            const client = generateClient();
            const response = await client.graphql({
                query: GET_PUBLIC_LINK_STATUS,
                variables: { providerId: providerId === 'all' ? null : providerId }
            }) as { data: { getPublicLinkStatus: PublicLinkStatus }, errors?: { message: string }[] };

            if (response.data?.getPublicLinkStatus) {
                setStatus(response.data.getPublicLinkStatus);
            } else if (response.errors) {
                throw new Error(response.errors[0]?.message || 'Error en la respuesta de GraphQL');
            }
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error('Error fetching public link status:', error);
            setError(error.message || 'No se pudo cargar la información del link público.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
        fetchData(selectedProvider);
    }, [selectedProvider]);

    // Auto-select provider for LITE plan
    useEffect(() => {
        if (tenant?.plan === 'LITE' && providers.length > 0 && selectedProvider === 'all') {
            const firstProviderId = providers[0].providerId;
            setSelectedProvider(firstProviderId);
            fetchData(firstProviderId);
        }
    }, [tenant, providers, selectedProvider]);

    const handleCopyLink = () => {
        if (status?.publicUrl) {
            navigator.clipboard.writeText(status.publicUrl);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const handleOpenLink = () => {
        if (status?.publicUrl) {
            window.open(status.publicUrl, '_blank');
        }
    };

    const handleProviderChange = (event: SelectChangeEvent) => {
        const newProviderId = event.target.value;
        setSelectedProvider(newProviderId);
        fetchData(newProviderId);
    };

    if (loading) {
        return (
            <ClientOnly>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <CircularProgress />
                </Box>
            </ClientOnly>
        );
    }

    return (
        <ClientOnly>
            <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
                {/* Main Content Area */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        transition: (theme) => theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                        marginRight: drawerOpen ? 0 : `-${DRAWER_WIDTH}px`,
                    }}
                >
                    {/* Top Bar Navigation */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            position: 'sticky',
                            top: 0,
                            zIndex: 1100,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" fontWeight="bold">Link de Reservas</Typography>
                            <Chip
                                label={status?.isPublished ? "Activo" : "Borrador"}
                                color={status?.isPublished ? "success" : "default"}
                                size="small"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', p: '4px 12px', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                    {status?.publicUrl || 'Cargando...'}
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                <Tooltip title={copySuccess ? "Copiado!" : "Copiar Link"}>
                                    <IconButton size="small" onClick={handleCopyLink} color={copySuccess ? "success" : "primary"}>
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <IconButton size="small" onClick={handleOpenLink} color="primary">
                                    <OpenInNewIcon fontSize="small" />
                                </IconButton>
                            </Box>

                            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} color="inherit">
                                {drawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                            </IconButton>
                        </Box>
                    </Paper>

                    <Container maxWidth="lg" sx={{ mt: 4, pb: 8 }}>
                        {error && <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>{error}</Alert>}

                        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, minHeight: 600, bgcolor: 'action.hover', position: 'relative' }}>
                            <CardHeader
                                title="Vista Previa en Vivo"
                                titleTypographyProps={{ variant: 'subtitle2', fontWeight: 'bold' }}
                                action={<Button size="small" startIcon={<OpenInNewIcon />} onClick={handleOpenLink}>Ver real</Button>}
                            />
                            <Divider />
                            <CardContent sx={{ height: 600, p: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                                {status?.publicUrl ? (
                                    <iframe
                                        src={status.publicUrl}
                                        style={{ width: '100%', height: '100%', border: 'none' }}
                                        title="Vista Previa"
                                    />
                                ) : (
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.disabled', bgcolor: 'action.hover' }}>
                                        <VisibilityIcon sx={{ fontSize: 64, mb: 2, opacity: 0.2 }} />
                                        <Typography variant="h6">Vista previa no disponible</Typography>
                                        <Typography variant="caption">Completa la configuración para ver tu página</Typography>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Container>
                </Box>

                {/* Right Sidebar Checklist */}
                <Drawer
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            bgcolor: 'background.paper',
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            boxShadow: -2,
                            top: '64px', // Offset for main header
                            height: 'calc(100vh - 64px)',
                        },
                    }}
                    variant="persistent"
                    anchor="right"
                    open={drawerOpen}
                >
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Checklist de Lanzamiento</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Completa estos pasos para que tu página se vea profesional y genere confianza.
                        </Typography>

                        <Stack spacing={3}>
                            {/* Multi-professional Selector if applicable */}
                            {!tenant ? (
                                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Typography variant="body2" color="text.secondary">Cargando información del plan...</Typography>
                                </Box>
                            ) : tenant.plan === 'LITE' ? (
                                <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'primary.contrastText' }}>
                                    <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.9 }}>MODO PROFESIONAL (Plan Lite)</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                        Gestionando checklist para: <strong>{providers.find(p => p.providerId === selectedProvider)?.name || 'Cargando...'}</strong>
                                    </Typography>
                                </Box>
                            ) : (
                                <FormControl fullWidth size="small">
                                    <InputLabel>Verificar Checklist para:</InputLabel>
                                    <Select
                                        value={selectedProvider}
                                        label="Verificar Checklist para:"
                                        onChange={handleProviderChange}
                                    >
                                        <MenuItem value="all">Página del Centro (General)</MenuItem>
                                        {providers.map((p) => (
                                            <MenuItem key={p.providerId} value={p.providerId}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" fontWeight="bold">Progreso Total</Typography>
                                    <Typography variant="caption" fontWeight="bold">{status?.completenessPercentage}%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={status?.completenessPercentage || 0} sx={{ height: 8, borderRadius: 4 }} />
                            </Box>

                            <Divider />

                            <List disablePadding>
                                {(status?.completenessChecklist || []).map((item) => (
                                    <ListItem key={item.item} sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                                        <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                                            {item.status === 'COMPLETE' ? (
                                                <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                                            ) : (
                                                item.isRequired ? <ErrorIcon color="error" sx={{ fontSize: 20 }} /> : <InfoIcon color="warning" sx={{ fontSize: 20 }} />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.label}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                                            secondary={item.isRequired ? "Esencial para reservas" : "Recomendado"}
                                            secondaryTypographyProps={{ variant: 'caption', color: item.isRequired ? 'error.main' : 'text.secondary' }}
                                        />
                                        {item.status !== 'COMPLETE' && item.actionUrl && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                href={item.actionUrl}
                                                sx={{ ml: 1, minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.7rem' }}
                                            >
                                                Corregir
                                            </Button>
                                        )}
                                    </ListItem>
                                ))}
                            </List>

                            <Alert severity="info" variant="outlined" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    <strong>Tip Lucía:</strong> Los negocios con logo y descripción reciben 3x más clics en sus links.
                                </Typography>
                            </Alert>

                            <Alert severity="success" variant="outlined" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                    <strong>Tip de Reservas:</strong> Pega tu URL en la bio de <strong>Instagram</strong> o como sitio web en <strong>Facebook</strong> para aumentar tus reservas hasta en un 50%.
                                </Typography>
                            </Alert>
                        </Stack>
                    </Box>
                </Drawer>
            </Box>
        </ClientOnly>
    );
}
