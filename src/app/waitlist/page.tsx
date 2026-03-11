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
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SEARCH_SERVICES } from '../../graphql/queries';
import { GET_WAITING_LIST_BY_SERVICE, REMOVE_WAITING_LIST_ENTRY } from '../../graphql/waitlist-queries';
import { useTenant } from '../../context/TenantContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PlanGuard from '../../components/PlanGuard';

interface WaitlistEntry {
    waitingListId: string;
    clientId: string;
    preferredDays: string[] | null;
    contactStatus: string;
    createdAt: string;
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
    
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    
    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [entryToDelete, setEntryToDelete] = React.useState<WaitlistEntry | null>(null);
    
    const { loading: tenantLoading, tenant } = useTenant();

    React.useEffect(() => {
        if (!tenantLoading && tenant) {
            fetchServices();
        } else if (!tenantLoading && !tenant) {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantLoading, tenant]);

    const fetchServices = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: SEARCH_SERVICES,
                variables: { text: '' },
                authMode: 'userPool' // Need authenticated fetch
            });
            const fetchedServices = response.data.searchServices || [];
            setServices(fetchedServices);
            
            if (fetchedServices.length > 0) {
                // Default select the first service
                setSelectedServiceId(fetchedServices[0].serviceId);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Error al cargar servicios');
            setLoading(false);
        }
    };

    const fetchWaitlist = async (serviceId: string) => {
        if (serviceId === 'all' || !serviceId) return;
        
        setLoading(true);
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
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            setError('Error al cargar la lista de espera');
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
        } catch (error) {
            console.error('Error removing entry:', error);
            alert('Error al eliminar la entrada');
        } finally {
            setDeleteConfirmOpen(false);
            setEntryToDelete(null);
        }
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'CONTACTED': return 'info';
            case 'BOOKED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    };

    return (
        <PlanGuard minPlan="PRO" featureName="Lista de Espera" variant="overlay">
            <Box p={4} maxWidth="1200px" margin="0 auto">
                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Lista de Espera ⏳
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Gestiona los clientes que están esperando un turno disponible.
                </Typography>

                <Box mb={4} display="flex" gap={2} alignItems="center">
                    <TextField
                        select
                        label="Servicio"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                        disabled={loading || services.length === 0}
                    >
                        {services.length === 0 && <MenuItem value="all">Sin servicios</MenuItem>}
                        {services.map((service) => (
                            <MenuItem key={service.serviceId} value={service.serviceId}>
                                {service.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 3 }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Solicitud</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Cliente (ID)</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Días Preferidos</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: 100 }} align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <CircularProgress size={30} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && entries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No hay nadie en la lista de espera para este servicio.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && entries.map((entry) => (
                                    <TableRow key={entry.waitingListId} hover>
                                        <TableCell>
                                            {new Date(entry.createdAt).toLocaleString('es-CL', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{entry.clientId}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{getDayLabels(entry.preferredDays)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={entry.contactStatus} 
                                                size="small" 
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                color={getStatusColor(entry.contactStatus) as any} 
                                            />
                                        </TableCell>
                                        <TableCell align="center">
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
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    title="Eliminar de Lista de Espera"
                    content="¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteConfirmOpen(false)}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    confirmColor="error"
                />
            </Box>
        </PlanGuard>
    );
}
