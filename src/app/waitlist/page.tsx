'use client';

import * as React from 'react';
import {
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    MenuItem,
    TextField,
    IconButton,
    Chip,
    Tooltip,
    Button,
    Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SEARCH_SERVICES, LIST_PROVIDERS } from '../../graphql/queries';
import { LIST_CLIENTS } from '../../graphql/client-queries';
import { GET_WAITING_LIST_BY_SERVICE, REMOVE_WAITING_LIST_ENTRY } from '../../graphql/waitlist-queries';
import { useTenant } from '../../context/TenantContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PlanGuard from '../../components/PlanGuard';
import WaitlistForm from '../../components/waitlist/WaitlistForm';

interface WaitlistEntry {
    waitingListId: string;
    clientId: string;
    providerId: string | null;
    preferredDays: string[] | null;
    requestedDates: string[] | null;
    contactStatus: string;
    createdAt: string;
    ttl: number | null;
}

interface Service {
    serviceId: string;
    name: string;
}

export default function WaitlistPage() {
    const client = React.useMemo(() => generateClient(), []);
    
    const [entries, setEntries] = React.useState<WaitlistEntry[]>([]);
    const [services, setServices] = React.useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = React.useState<string>('all');
    
    // Dictionaries for mapping IDs to Names
    const [clientsMap, setClientsMap] = React.useState<Record<string, string>>({});
    const [providersMap, setProvidersMap] = React.useState<Record<string, string>>({});

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [entryToDelete, setEntryToDelete] = React.useState<WaitlistEntry | null>(null);
    const [formOpen, setFormOpen] = React.useState(false);
    
    const { loading: tenantLoading, tenant } = useTenant();

    React.useEffect(() => {
        if (!tenantLoading && tenant) {
            fetchInitialData();
        } else if (!tenantLoading && !tenant) {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantLoading, tenant]);

    const fetchInitialData = async () => {
        setLoading(true);
        setError('');
        let finalServiceId = selectedServiceId;
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const [servicesRes, providersRes, clientsRes] = await Promise.allSettled([
                client.graphql({
                    query: SEARCH_SERVICES,
                    variables: { text: '' },
                    authMode: 'userPool'
                }),
                client.graphql({
                    query: LIST_PROVIDERS,
                    authToken: token
                }),
                client.graphql({
                    query: LIST_CLIENTS,
                    authToken: token
                })
            ]);
            
            // Handle Services
            if (servicesRes.status === 'fulfilled') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fetchedServices = (servicesRes.value as any).data.searchServices || [];
                setServices(fetchedServices);
                if (fetchedServices.length > 0 && selectedServiceId === 'all') {
                    finalServiceId = fetchedServices[0].serviceId;
                    setSelectedServiceId(finalServiceId);
                }
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error('Error fetching services:', (servicesRes as any).reason);
            }

            // Handle Providers
            if (providersRes.status === 'fulfilled') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fetchedProviders = (providersRes.value as any).data.listProviders || [];
                const pMap: Record<string, string> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fetchedProviders.forEach((p: any) => {
                    pMap[p.providerId] = p.name;
                });
                setProvidersMap(pMap);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error('Error fetching providers:', (providersRes as any).reason);
            }

            // Handle Clients
            if (clientsRes.status === 'fulfilled') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fetchedClients = (clientsRes.value as any).data.listClients || [];
                const cMap: Record<string, string> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fetchedClients.forEach((c: any) => {
                    const givenNames = c.names?.given || [];
                    const given = Array.isArray(givenNames) ? givenNames.join(' ') : (givenNames || '');
                    const family = c.names?.family || '';
                    const displayName = `${given} ${family}`.trim() || c.email || c.id;
                    cMap[c.id] = displayName;
                });
                setClientsMap(cMap);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                console.error('Error fetching clients:', (clientsRes as any).reason);
            }

        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Error al cargar datos. Por favor intenta nuevamente.');
        } finally {
            if (finalServiceId === 'all') {
                setLoading(false);
            }
        }
    };

    const fetchWaitlist = async (serviceId: string) => {
        if (serviceId === 'all' || !serviceId) return;
        
        setLoading(true);
        setError('');
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_WAITING_LIST_BY_SERVICE,
                variables: { serviceId },
                authToken: token
            });
            
            const waitlistData = response.data.getWaitingListByService || [];
            // Sort by createdAt ASC (FIFO)
            waitlistData.sort((a: WaitlistEntry, b: WaitlistEntry) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            setEntries(waitlistData);
        } catch (err) {
            console.error('Error fetching waitlist:', err);
            setError('Error al cargar la lista de espera. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (selectedServiceId !== 'all') {
            fetchWaitlist(selectedServiceId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServiceId]);

    const handleDeleteClick = (entry: WaitlistEntry) => {
        setEntryToDelete(entry);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!entryToDelete) return;

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: REMOVE_WAITING_LIST_ENTRY,
                variables: { waitingListId: entryToDelete.waitingListId },
                authToken: token
            });

            setEntries((prev) => prev.filter(e => e.waitingListId !== entryToDelete.waitingListId));
        } catch (err) {
            console.error('Error removing entry:', err);
            alert('Error al eliminar la entrada');
        } finally {
            setDeleteConfirmOpen(false);
            setEntryToDelete(null);
        }
    };

    const handleCreateClick = () => {
        setFormOpen(true);
    };

    const getDayLabels = (days: string[] | null) => {
        if (!days || days.length === 0) return 'Cualquier día';
        const map: Record<string, string> = {
            'MONDAY': 'Lun',
            'TUESDAY': 'Mar',
            'WEDNESDAY': 'Mié',
            'THURSDAY': 'Jue',
            'FRIDAY': 'Vie',
            'SATURDAY': 'Sáb',
            'SUNDAY': 'Dom'
        };
        return days.map(d => map[d] || d).join(', ');
    };

    const formatRequestedDates = (dates: string[] | null) => {
        if (!dates || dates.length === 0) return 'No especificadas';
        if (dates.length === 1) {
            return new Date(dates[0]).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
        }
        if (dates.length <= 3) {
            return dates.map(d => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })).join(', ');
        }
        // If more than 3, summarize
        return `${dates.length} fechas seleccionadas`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'CONTACTED': return 'info';
            case 'BOOKED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return 'En Espera';
            case 'CONTACTED': return 'Contactado';
            case 'BOOKED': return 'Agendado';
            case 'CANCELLED': return 'Cancelado';
            default: return status; // Fallback
        }
    };

    return (
        <PlanGuard minPlan="PRO" featureName="Lista de Espera" variant="overlay">
            <Box p={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        Lista de Espera
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleCreateClick}
                    >
                        Nuevo en Fila
                    </Button>
                </Box>
                
                <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
                    Gestiona y visualiza a los clientes que están esperando que un turno se libere en tu agenda.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box mb={4} display="flex" gap={2} alignItems="center">
                    <TextField
                        select
                        label="Servicio"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 250 }}
                        disabled={services.length === 0}
                    >
                        {services.length === 0 && <MenuItem value="all">Sin servicios</MenuItem>}
                        {services.map((service) => (
                            <MenuItem key={service.serviceId} value={service.serviceId}>
                                {service.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Solicitud</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Profesional</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Días Preferidos</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Fechas Específicas</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Expira</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body1" color="textSecondary">
                                            No hay clientes esperando por este servicio en este momento.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry.waitingListId} hover>
                                        <TableCell>
                                            {new Date(entry.createdAt).toLocaleString('es-CL', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {clientsMap[entry.clientId] || entry.clientId}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {entry.providerId ? (providersMap[entry.providerId] || 'Desconocido') : 'Cualquiera'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{getDayLabels(entry.preferredDays)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{formatRequestedDates(entry.requestedDates)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {entry.ttl ? new Date(entry.ttl * 1000).toLocaleDateString('es-CL') : 'Sin expiración'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={getStatusLabel(entry.contactStatus)} 
                                                size="small" 
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                color={getStatusColor(entry.contactStatus) as any} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Eliminar de lista">
                                                <IconButton 
                                                    size="small" 
                                                    color="error"
                                                    onClick={() => handleDeleteClick(entry)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    title="Eliminar de Lista de Espera"
                    content="¿Estás seguro de que deseas eliminar a este cliente de la lista de espera? Esta acción no se puede deshacer."
                    onConfirm={confirmDelete}
                    onClose={() => setDeleteConfirmOpen(false)}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    confirmColor="error"
                />

                <WaitlistForm
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                    onSuccess={() => fetchWaitlist(selectedServiceId)}
                    preselectedServiceId={selectedServiceId}
                />
            </Box>
        </PlanGuard>
    );
}
