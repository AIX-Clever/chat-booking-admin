'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LIST_PROVIDERS, CREATE_PROVIDER, UPDATE_PROVIDER, DELETE_PROVIDER, SEARCH_SERVICES, GENERATE_PRESIGNED_URL } from '../../graphql/queries';
import {
    Typography,
    Button,
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    InputAdornment,
    MenuItem,
    Autocomplete,
    Avatar,
    Stack,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GoogleCalendarCard from '../../components/integrations/GoogleCalendarCard';
import MicrosoftCalendarCard from '../../components/integrations/MicrosoftCalendarCard';
import { Paper, Snackbar, Alert, Tooltip } from '@mui/material';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import PlanGuard from '../../components/PlanGuard';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { usePlanUsage } from '../../hooks/useDashboardMetrics';

// --- Types ---

// --- Types ---
interface Service {
    id: string;
    name: string;
}

interface Provider {
    id: string;
    name: string;
    bio: string;
    serviceIds: string[]; // List of assigned service IDs
    timezone: string;
    active: boolean;
    photoUrl?: string; // Optimized WebP URL
    photoUrlThumbnail?: string; // Thumbnail URL
    hasGoogleCalendar?: boolean;
    hasMicrosoftCalendar?: boolean;
    slug?: string;
    aiDrivers: {
        traits: string[];
        languages: string[];
        specialties: string[];
    };
    professionalLicense?: string;
}

// --- Mock Data ---
const client = generateClient();

// Replicating some services for assignment
// MOCK_AVAILABLE_SERVICES removed


// Unused mock data removed


const TIMEZONES = [
    'America/Santiago',
    'America/Buenos_Aires',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'UTC'
];

interface CustomTabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: CustomTabPanelProps) {
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
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ProvidersPage() {
    const t = useTranslations('providers');
    const tCommon = useTranslations('common');
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [availableServices, setAvailableServices] = React.useState<Service[]>([]);
    const [open, setOpen] = React.useState(false);
    const [currentProvider, setCurrentProvider] = React.useState<Provider | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);

    // Tab State
    const [tabValue, setTabValue] = React.useState(0);

    // Plan Enforcement
    const planFeatures = usePlanFeatures();
    usePlanUsage(); // Called to trigger fetch but usage not needed directly in this view yet

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmConfig, setConfirmConfig] = React.useState<{
        title: string;
        content: string;
        action: () => void;
    }>({ title: '', content: '', action: () => { } });

    // Form State
    const [formData, setFormData] = React.useState<Provider>({
        id: '',
        name: '',
        bio: '',
        serviceIds: [],
        timezone: 'America/Santiago',
        active: true,
        slug: '',
        aiDrivers: {
            traits: [],
            languages: ['Español'],
            specialties: []
        },
        professionalLicense: ''
    });

    const [tenantId, setTenantId] = React.useState<string>('');

    // Snackbar State
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState('');
    const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error' | 'info'>('success');

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    React.useEffect(() => {
        fetchProviders();
        fetchServices();
        fetchTenantId();
    }, []);

    const fetchTenantId = async () => {
        try {
            const session = await fetchAuthSession();
            const payload = session.tokens?.idToken?.payload;
            if (payload && payload['custom:tenantId']) {
                setTenantId(payload['custom:tenantId'] as string);
            }
        } catch (e) {
            console.error("Error fetching tenant ID", e);
        }
    }

    const fetchProviders = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_PROVIDERS });
            // Map backend response to local state if needed, or adjust types
            // Backend returns: providerId, name, timezone, available. Bio & serviceIds might be missing in list? 
            // The LIST_PROVIDERS query in queries.ts only has { providerId, name, timezone, available }. 
            // We might need to update the query to get more details or fetch detail on open.
            // For now let's work with what we have and assume bio/services might be empty on list.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fetched = response.data.listProviders.map((p: any) => {
                // Parse metadata if valid JSON string, or use object if already parsed
                let aiDrivers = { traits: [], languages: ['Español'], specialties: [] };
                try {
                    if (p.metadata) {
                        const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
                        if (meta.aiDrivers) aiDrivers = meta.aiDrivers;
                    }
                } catch (e) {
                    console.warn('Failed to parse metadata for provider', p.providerId, e);
                }

                return {
                    id: p.providerId,
                    name: p.name,
                    bio: p.bio || '',
                    serviceIds: p.serviceIds || [],
                    timezone: p.timezone,
                    active: p.available,
                    photoUrl: p.photoUrl,
                    photoUrlThumbnail: p.photoUrlThumbnail,
                    hasGoogleCalendar: p.hasGoogleCalendar,
                    hasMicrosoftCalendar: p.hasMicrosoftCalendar,
                    slug: p.slug || '',
                    aiDrivers: aiDrivers,
                    professionalLicense: p.professionalLicense || ''
                };
            });
            setProviders(fetched);
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const fetchServices = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: SEARCH_SERVICES, variables: { text: '' } });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const services = response.data.searchServices.map((s: any) => ({
                id: s.serviceId,
                name: s.name
            }));
            setAvailableServices(services);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleOpen = (provider?: Provider) => {
        setTabValue(0);
        if (provider) {
            setFormData(provider);
            setCurrentProvider(provider);
        } else {
            setFormData({
                id: '',
                name: '',
                bio: '',
                serviceIds: [],
                timezone: 'America/Santiago',
                active: true,
                slug: '',
                aiDrivers: {
                    traits: [],
                    languages: ['Español'],
                    specialties: []
                },
                professionalLicense: ''
            });
            setCurrentProvider(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            showSnackbar('Por favor selecciona un archivo de imagen válido', 'error');
            return;
        }

        setIsUploading(true);
        try {
            // 1. Get Presigned URL
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GENERATE_PRESIGNED_URL,
                variables: {
                    fileName,
                    contentType: file.type
                }
            });
            const presignedUrl = response.data.generatePresignedUrl;

            // 2. Upload to S3
            const uploadResponse = await fetch(presignedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Upload failed');
            }

            // 3. Construct public URL using CDN
            // Extract the path (key) from the presigned URL
            try {
                const urlObj = new URL(presignedUrl);
                const path = urlObj.pathname; // includes leading slash, e.g. /raw/tenant/uuid-file.jpg

                const cdnDomain = process.env.NEXT_PUBLIC_ASSETS_CDN_DOMAIN;
                let newPhotoUrl = '';

                if (cdnDomain) {
                    // Use CDN domain with the extracted path
                    // Ensure protocol is handling correctly (environment variable should not have protocol)
                    newPhotoUrl = `https://${cdnDomain}${path}`;
                } else {
                    // Fallback to S3 URL (without query params)
                    console.warn("NEXT_PUBLIC_ASSETS_CDN_DOMAIN is missing");
                    newPhotoUrl = `${urlObj.origin}${path}`;
                }

                setFormData(prev => ({
                    ...prev,
                    photoUrl: newPhotoUrl
                }));
            } catch (e) {
                console.error("Error parsing presigned URL", e);
                // Fallback: use the raw presigned url but stripped of query params? 
                // Or just fail gracefully.
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            showSnackbar('Error al subir la imagen', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddNew = () => {
        if (!planFeatures.canCreateProvider) {
            showSnackbar(`Límite alcanzado: Tu plan ${planFeatures.plan} permite hasta ${planFeatures.maxProviders} profesionales.`, 'warning');
            return;
        }
        setCurrentProvider(null);
        setFormData({
            id: '',
            name: '',
            bio: '',
            serviceIds: [],
            timezone: 'America/Santiago',
            active: true,
            slug: '',
            aiDrivers: {
                traits: [],
                languages: ['Español'],
                specialties: []
            },
            professionalLicense: ''
        });
        setTabValue(0);
        setOpen(true);
    };

    const handleSave = async () => {
        try {
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (currentProvider) {
                // Update
                const input = {
                    providerId: currentProvider.id,
                    name: formData.name,
                    bio: formData.bio,
                    serviceIds: formData.serviceIds,
                    timezone: formData.timezone,
                    photoUrl: formData.photoUrl,
                    // photoUrlThumbnail: formData.photoUrlThumbnail, // We can let lambda update this or set if we knew it
                    metadata: JSON.stringify({ aiDrivers: formData.aiDrivers }),
                    available: formData.active,
                    slug: formData.slug,
                    professionalLicense: formData.professionalLicense
                };

                await client.graphql({
                    query: UPDATE_PROVIDER,
                    variables: { input },
                    authToken: token
                });
            } else {
                // Create
                const finalSlug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
                const input = {
                    name: formData.name,
                    bio: formData.bio,
                    serviceIds: formData.serviceIds,
                    timezone: formData.timezone,
                    photoUrl: formData.photoUrl,
                    metadata: JSON.stringify({ aiDrivers: formData.aiDrivers }),
                    slug: finalSlug,
                    professionalLicense: formData.professionalLicense
                };

                await client.graphql({
                    query: CREATE_PROVIDER,
                    variables: { input },
                    authToken: token
                });
            }
            fetchProviders(); // Refresh list
            setOpen(false);
            showSnackbar(currentProvider ? 'Profesional actualizado' : 'Profesional creado exitosamente');
        } catch (error) {
            console.error('Error saving provider:', error);
            showSnackbar('Error al guardar el profesional', 'error');
        }
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmConfig({
            title: t('deleteDialog.title'),
            content: t('deleteDialog.message', { name }),
            action: async () => {
                try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();

                    await client.graphql({
                        query: DELETE_PROVIDER,
                        variables: { providerId: id },
                        authToken: token
                    });
                    setProviders((prev) => prev.filter((p) => p.id !== id));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting provider:', error);
                    showSnackbar('Error al eliminar el profesional', 'error');
                }
            }
        });
        setConfirmOpen(true);
    };

    const handleCopyLink = (slug?: string) => {
        if (!slug) return;
        const url = `https://agendar.holalucia.cl/${slug}`;
        navigator.clipboard.writeText(url);
        showSnackbar('¡Enlace copiado al portapapeles! 📋', 'success');
    };

    const filteredProviders = providers.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <>
            <ConfirmDialog
                open={confirmOpen}
                title={confirmConfig.title}
                content={confirmConfig.content}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmConfig.action}
            />

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                <Box>
                    <Typography variant="h4">{t('title')}</Typography>
                    <Typography variant="caption" sx={{ color: 'red', display: 'block' }}>
                        DEBUG API: {process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT}
                    </Typography>
                </Box>
                <Tooltip title={!planFeatures.canCreateProvider ? `Límite de ${planFeatures.maxProviders} profesionales alcanzado para el plan ${planFeatures.plan}. Sube de nivel para agregar más.` : ""}>
                    <span>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddNew}
                            disabled={!planFeatures.canCreateProvider}
                        >
                            Nuevo Profesional
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                <TableContainer sx={{ minWidth: 800 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('columns.name')}</TableCell>
                                <TableCell>{t('columns.assignedServices')}</TableCell>
                                <TableCell>{t('columns.aiDrivers')}</TableCell>
                                <TableCell>{t('columns.linkBio')}</TableCell>
                                <TableCell>{t('columns.timezone')}</TableCell>
                                <TableCell>{t('columns.status')}</TableCell>
                                <TableCell align="right">{tCommon('actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProviders.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar alt={row.name} src={row.photoUrl} >{row.name.charAt(0)}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" noWrap>
                                                    {row.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 200 }} noWrap>
                                                    {row.bio}
                                                </Typography>
                                                <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                                    ID: {row.id}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {row.serviceIds.length > 0 ? (
                                                <>
                                                    <Chip label={t('servicesCount', { count: row.serviceIds.length })} size="small" variant="outlined" />
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">No services</Typography>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="column" spacing={0.5}>
                                            {row.aiDrivers.traits.length > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {row.aiDrivers.traits.slice(0, 2).join(', ')}{row.aiDrivers.traits.length > 2 ? '...' : ''}
                                                </Typography>
                                            )}
                                            {row.aiDrivers.specialties.length > 0 && (
                                                <Typography variant="caption" color="primary" sx={{ opacity: 0.8 }}>
                                                    {row.aiDrivers.specialties.slice(0, 1).join(', ')}{row.aiDrivers.specialties.length > 1 ? '...' : ''}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleCopyLink(row.slug)}
                                            disabled={!row.slug}
                                            startIcon={<LinkIcon />}
                                            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                                        >
                                            {row.slug ? 'Copiar Link' : 'Sin Link'}
                                        </Button>
                                    </TableCell>
                                    <TableCell>{row.timezone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.active ? t('status.active') : t('status.inactive')}
                                            color={row.active ? 'success' : 'default'}
                                            size="small"
                                            variant="filled"
                                            sx={{ borderRadius: 1 }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleOpen(row)} color="primary">
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleDelete(row.id, row.name)} color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProviders.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {t('noProvidersFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentProvider ? t('editProvider') : t('newProvider')}</DialogTitle>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {/* Always show Tabs to allow access to configurations */}
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="provider tabs">
                        <Tab label={t('dialog.tabs.general')} />
                        <Tab label={t('dialog.tabs.services')} />
                        <Tab label={t('dialog.tabs.aiContext')} />
                        <Tab label={t('dialog.tabs.linkBio')} />
                        <Tab label={t('dialog.tabs.integrations')} />
                    </Tabs>
                </Box>
                <DialogContent dividers={false} sx={{ minHeight: 320 }}>

                    {/* Tab 1: General */}
                    <CustomTabPanel value={tabValue} index={0}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Image Upload */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ position: 'relative' }}>
                                    <Avatar
                                        src={formData.photoUrl}
                                        alt={formData.name}
                                        sx={{ width: 100, height: 100, border: '1px solid #ddd' }}
                                    >
                                        {!formData.photoUrl && formData.name.charAt(0)}
                                    </Avatar>
                                    {isUploading && (
                                        <CircularProgress
                                            size={100}
                                            sx={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                zIndex: 1
                                            }}
                                        />
                                    )}
                                </Box>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    size="small"
                                    startIcon={<CloudUploadIcon />}
                                    disabled={isUploading}
                                >
                                    {t('dialog.general.uploadPhoto')}
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                </Button>
                            </Box>

                            <TextField
                                label={t('dialog.general.fullName')}
                                fullWidth
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <TextField
                                label={t('dialog.general.biography')}
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                            <TextField
                                label={t('dialog.general.professionalLicense')}
                                fullWidth
                                value={formData.professionalLicense}
                                onChange={(e) => setFormData({ ...formData, professionalLicense: e.target.value })}
                                placeholder="Ej: Colegio Médico N° 123456"
                            />
                            <TextField
                                label={t('dialog.general.timezone')}
                                fullWidth
                                select
                                value={formData.timezone}
                                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            >
                                {TIMEZONES.map((tz) => (
                                    <MenuItem key={tz} value={tz}>
                                        {tz}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.active}
                                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                    />
                                }
                                label={formData.active ? t('dialog.general.providerIsActive') : t('dialog.general.providerIsActive')}
                            />
                        </Box>
                    </CustomTabPanel>

                    {/* Tab 2: Services */}
                    <CustomTabPanel value={tabValue} index={1}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Autocomplete
                                multiple
                                options={availableServices}
                                getOptionLabel={(option) => option.name}
                                value={availableServices.filter(s => formData.serviceIds.includes(s.id))}
                                onChange={(event, newValue) => {
                                    setFormData({ ...formData, serviceIds: newValue.map(s => s.id) });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('dialog.services.assignedServices')}
                                        placeholder={t('dialog.services.selectServices')}
                                        helperText={t('dialog.services.description')}
                                    />
                                )}
                            />
                            <Typography variant="body2" color="text.secondary">
                                {t('dialog.services.helperText')}
                            </Typography>
                        </Box>
                    </CustomTabPanel>

                    {/* Tab 3: AI Context */}
                    <CustomTabPanel value={tabValue} index={2}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* ... Content of Tab 2 ... */}
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={formData.aiDrivers.traits}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        aiDrivers: { ...formData.aiDrivers, traits: newValue as string[] }
                                    });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('dialog.aiContext.personalityTraits')}
                                        placeholder={t('dialog.aiContext.traitsPlaceholder')}
                                        helperText={t('dialog.aiContext.traitsHelper')}
                                    />
                                )}
                            />

                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={formData.aiDrivers.specialties}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        aiDrivers: { ...formData.aiDrivers, specialties: newValue as string[] }
                                    });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('dialog.aiContext.granularSpecialties')}
                                        placeholder={t('dialog.aiContext.specialtiesPlaceholder')}
                                        helperText={t('dialog.aiContext.specialtiesHelper')}
                                    />
                                )}
                            />

                            <Autocomplete
                                multiple
                                freeSolo
                                options={['Español', 'Inglés', 'Portugués', 'Francés']}
                                value={formData.aiDrivers.languages}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        aiDrivers: { ...formData.aiDrivers, languages: newValue as string[] }
                                    });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('dialog.aiContext.languages')}
                                        placeholder={t('dialog.aiContext.languagesPlaceholder')}
                                    />
                                )}
                            />
                        </Box>
                    </CustomTabPanel>

                    {/* Tab 3: Link Bio (Slug) */}
                    <CustomTabPanel value={tabValue} index={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography variant="body2" color="text.secondary">
                                Define la dirección web única donde tus pacientes agendarán contigo.
                            </Typography>
                            <TextField
                                label="Identificador (Slug)"
                                placeholder="ej: dr-juan-perez"
                                fullWidth
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                helperText="Usa solo letras minúsculas, números y guiones."
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">agendar.holalucia.cl/</InputAdornment>,
                                    style: { fontSize: '1rem' }
                                }}
                            />

                            {/* Live Preview & Copy */}
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                                        TU ENLACE FINAL
                                    </Typography>
                                    <Typography variant="h6" color="primary" sx={{ wordBreak: 'break-all', fontSize: '1.1rem' }}>
                                        agendar.holalucia.cl/{formData.slug || 'tu-nombre'}
                                    </Typography>
                                </Box>
                                <Button
                                    startIcon={<ContentCopyIcon />}
                                    onClick={() => handleCopyLink(formData.slug)}
                                    variant="outlined"
                                    size="small"
                                    disabled={!formData.slug}
                                >
                                    Copiar
                                </Button>
                            </Paper>
                        </Box>
                    </CustomTabPanel>

                    {/* Tab 4: Integrations */}
                    <CustomTabPanel value={tabValue} index={4}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <PlanGuard minPlan="PRO" featureName="Integración de Calendarios" variant="overlay" upgradeFeature="AI">
                                <GoogleCalendarCard
                                    providerId={formData.id}
                                    tenantId={tenantId}
                                    isConnected={!!formData.hasGoogleCalendar}
                                    onDisconnect={() => { showSnackbar("Función de desconexión próximamente", "info"); }}
                                />
                                <MicrosoftCalendarCard
                                    providerId={formData.id}
                                    tenantId={tenantId}
                                    isConnected={!!formData.hasMicrosoftCalendar}
                                    onDisconnect={() => { showSnackbar("Función de desconexión próximamente", "info"); }}
                                />
                            </PlanGuard>
                        </Box>
                    </CustomTabPanel>

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        {tCommon('cancel')}
                    </Button>

                    {!currentProvider ? (
                        /* New Provider Flow: Wizard (Step 0 -> Step 1 [Services] -> Save) */
                        <>
                            {tabValue === 0 ? (
                                <Button
                                    onClick={() => setTabValue(1)}
                                    variant="contained"
                                    disabled={!formData.name}
                                >
                                    {tCommon('next')}
                                </Button>
                            ) : (
                                <>
                                    <Button onClick={() => setTabValue(0)} color="inherit" sx={{ mr: 1 }}>
                                        {tCommon('back')}
                                    </Button>
                                    <Button onClick={handleSave} variant="contained">
                                        {tCommon('save')}
                                    </Button>
                                </>
                            )}
                        </>
                    ) : (
                        /* Edit Flow: Standard Save */
                        <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
                            {tCommon('save')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}
