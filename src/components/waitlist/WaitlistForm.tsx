import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Alert,
    CircularProgress,
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Chip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ADD_TO_WAITING_LIST } from '../../graphql/waitlist-queries';
import { LIST_CLIENTS } from '../../graphql/client-queries';
import { SEARCH_SERVICES } from '../../graphql/queries';
import { Client } from '../clients/ClientForm';

interface Service {
    serviceId: string;
    name: string;
}

interface WaitlistFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    preselectedServiceId?: string;
}

const client = generateClient();

const DAYS_OF_WEEK = [
    { value: 'MONDAY', label: 'Lunes' },
    { value: 'TUESDAY', label: 'Martes' },
    { value: 'WEDNESDAY', label: 'Miércoles' },
    { value: 'THURSDAY', label: 'Jueves' },
    { value: 'FRIDAY', label: 'Viernes' },
    { value: 'SATURDAY', label: 'Sábado' },
    { value: 'SUNDAY', label: 'Domingo' }
];

export default function WaitlistForm({ open, onClose, onSuccess, preselectedServiceId }: WaitlistFormProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [servicesList, setServicesList] = useState<Service[]>([]);

    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [requestedDates, setRequestedDates] = useState<string[]>([]);
    const [newDate, setNewDate] = useState<string>('');
    const [anyDay, setAnyDay] = useState(true);

    useEffect(() => {
        if (open) {
            fetchFormData();
            if (preselectedServiceId && preselectedServiceId !== 'all') {
                setSelectedServiceId(preselectedServiceId);
            }
        } else {
            // Reset form when closed
            setSelectedClientId('');
            setSelectedDays([]);
            setRequestedDates([]);
            setNewDate('');
            setAnyDay(true);
            setError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, preselectedServiceId]);

    const fetchFormData = async () => {
        setFetchingData(true);
        setError(null);
        try {
            // Fetch services and clients in parallel
            const [servicesResponse, clientsResponse] = await Promise.all([
                client.graphql({
                    query: SEARCH_SERVICES,
                    variables: { text: '' },
                    authMode: 'userPool'
                }),
                client.graphql({
                    query: LIST_CLIENTS
                })
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sList = (servicesResponse as any).data.searchServices || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const cList = (clientsResponse as any).data.listClients || [];

            setServicesList(sList);
            setClientsList(cList);
            
            // Auto-select if there is exactly one
            if (sList.length === 1 && (!preselectedServiceId || preselectedServiceId === 'all')) {
                setSelectedServiceId(sList[0].serviceId);
            }
        } catch (err) {
            console.error('Error fetching form data:', err);
            setError('Error al cargar datos para el formulario.');
        } finally {
            setFetchingData(false);
        }
    };

    const handleDayToggle = (day: string) => {
        setAnyDay(false);
        setSelectedDays(prev => 
            prev.includes(day) 
                ? prev.filter(d => d !== day) 
                : [...prev, day]
        );
    };

    const handleAnyDayToggle = (checked: boolean) => {
        setAnyDay(checked);
        if (checked) {
            setSelectedDays([]);
            setRequestedDates([]);
        }
    };

    const handleAddDate = () => {
        if (newDate && !requestedDates.includes(newDate)) {
            setRequestedDates([...requestedDates, newDate]);
            setNewDate('');
            setAnyDay(false);
        }
    };

    const handleRemoveDate = (dateToRemove: string) => {
        setRequestedDates(requestedDates.filter(d => d !== dateToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedClientId) {
            setError('Por favor, selecciona un cliente.');
            return;
        }
        
        if (!selectedServiceId || selectedServiceId === 'all') {
            setError('Por favor, selecciona un servicio.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const input = {
                clientId: selectedClientId,
                serviceId: selectedServiceId,
                preferredDays: anyDay ? null : selectedDays.length > 0 ? selectedDays : null,
                requestedDates: anyDay ? null : requestedDates.length > 0 ? requestedDates : null,
            };

            await client.graphql({
                query: ADD_TO_WAITING_LIST,
                variables: { input },
                authToken: token
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Error adding to waitlist:', err);
            // Handle AppSync authorization or validation errors
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const awsError = err as any;
            if (awsError.errors && awsError.errors.length > 0) {
                setError(awsError.errors[0].message);
            } else {
                setError('Ocurrió un error al añadir a la lista de espera.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Añadir a Lista de Espera</DialogTitle>
            
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    )}

                    {fetchingData ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" gap={3}>
                            <TextField
                                select
                                label="Cliente"
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                            >
                                {clientsList.length === 0 && (
                                    <MenuItem value="" disabled>No hay clientes registrados</MenuItem>
                                )}
                                {clientsList.map((c) => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.names.given} {c.names.family}
                                        {c.identifiers?.length > 0 && ` (${c.identifiers[0].value})`}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Servicio"
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                            >
                                {servicesList.length === 0 && (
                                    <MenuItem value="" disabled>No hay servicios</MenuItem>
                                )}
                                {servicesList.map((s) => (
                                    <MenuItem key={s.serviceId} value={s.serviceId}>
                                        {s.name}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    Disponibilidad (Opcional)
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={anyDay} 
                                            onChange={(e) => handleAnyDayToggle(e.target.checked)} 
                                            color="primary"
                                        />
                                    }
                                    label="Cualquier día de la semana"
                                />
                                
                                <FormGroup row sx={{ ml: 2, mt: 1, opacity: anyDay ? 0.5 : 1, pointerEvents: anyDay ? 'none' : 'auto' }}>
                                    {DAYS_OF_WEEK.map((day) => (
                                        <FormControlLabel
                                            key={day.value}
                                            control={
                                                <Checkbox 
                                                    size="small"
                                                    checked={selectedDays.includes(day.value)}
                                                    onChange={() => handleDayToggle(day.value)}
                                                />
                                            }
                                            label={day.label}
                                            sx={{ width: '45%' }}
                                        />
                                    ))}
                                </FormGroup>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                    Fechas Específicas (Opcional)
                                </Typography>
                                <Box sx={{ opacity: anyDay ? 0.5 : 1, pointerEvents: anyDay ? 'none' : 'auto' }}>
                                    <Box display="flex" gap={1} mb={2}>
                                        <TextField
                                            type="date"
                                            size="small"
                                            value={newDate}
                                            onChange={(e) => setNewDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                        <Button 
                                            variant="outlined" 
                                            onClick={handleAddDate}
                                            disabled={!newDate}
                                            startIcon={<AddIcon />}
                                        >
                                            Añadir
                                        </Button>
                                    </Box>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {requestedDates.map((date) => (
                                            <Chip
                                                key={date}
                                                label={new Date(date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                onDelete={() => handleRemoveDate(date)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))}
                                        {requestedDates.length === 0 && !anyDay && (
                                            <Typography variant="body2" color="textSecondary">
                                                No hay fechas específicas seleccionadas.
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={onClose} disabled={loading} color="inherit">
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading || fetchingData || !selectedClientId || !selectedServiceId || selectedServiceId === 'all'}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Añadir a la Fila'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
