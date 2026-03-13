import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Chip,
    InputLabel,
    Select,
    FormControl,
    Paper,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Add as AddIcon } from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, isValid } from 'date-fns';
import { es, enUS, pt } from 'date-fns/locale';
import { useLocale } from 'next-intl';
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
    const locale = useLocale();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [servicesList, setServicesList] = useState<Service[]>([]);

    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId || '');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [requestedDates, setRequestedDates] = useState<string[]>([]);
    const [newDate, setNewDate] = useState<Date | null>(null);
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
            setNewDate(null);
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
                    query: LIST_CLIENTS,
                    authMode: 'userPool'
                })
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setServicesList((servicesResponse as { data: { searchServices: Service[] } }).data.searchServices || []);
            setClientsList((clientsResponse as { data: { listClients: Client[] } }).data.listClients || []);
        } catch (err) {
            console.error('Error fetching form data:', err);
            setError('Error al cargar servicios o clientes');
        } finally {
            setFetchingData(false);
        }
    };

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
        setAnyDay(false);
    };

    const handleAddDate = () => {
        if (newDate && isValid(newDate)) {
            const dateStr = format(newDate, 'yyyy-MM-dd');
            if (!requestedDates.includes(dateStr)) {
                setRequestedDates([...requestedDates, dateStr]);
                setNewDate(null);
                setAnyDay(false);
            }
        }
    };

    const handleRemoveDate = (date: string) => {
        setRequestedDates(prev => prev.filter(d => d !== date));
        if (requestedDates.length === 1 && selectedDays.length === 0) {
            setAnyDay(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: ADD_TO_WAITING_LIST,
                variables: {
                    input: {
                        clientId: selectedClientId,
                        serviceId: selectedServiceId,
                        requestedDays: anyDay ? [] : selectedDays,
                        requestedDates: anyDay ? [] : requestedDates,
                        status: 'PENDING',
                        notes: ''
                    }
                },
                authToken: token
            });

            onSuccess();
            onClose();
        } catch (err: unknown) {
            console.error('Error adding to waitlist:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error al añadir a la lista de espera';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Añadir a Fila de Espera</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
                        {error && (
                            <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}

                        <FormControl fullWidth size="small">
                            <InputLabel>Seleccionar Cliente</InputLabel>
                            <Select
                                value={selectedClientId}
                                label="Seleccionar Cliente"
                                onChange={(e) => setSelectedClientId(e.target.value)}
                                required
                                disabled={fetchingData}
                            >
                                <MenuItem value=""><em>Seleccione un cliente</em></MenuItem>
                                {clientsList.map((client) => {
                                    const given = Array.isArray(client.names?.given) ? client.names.given.join(' ') : (client.names?.given || '');
                                    const family = client.names?.family || '';
                                    const email = client.contactInfo?.find(c => c.system === 'email')?.value;
                                    const displayName = `${given} ${family}`.trim() || email || client.id;
                                    return (
                                        <MenuItem key={client.id} value={client.id}>
                                            {displayName}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Servicio</InputLabel>
                            <Select
                                value={selectedServiceId}
                                label="Servicio"
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                required
                                disabled={fetchingData}
                            >
                                <MenuItem value=""><em>Seleccione un servicio</em></MenuItem>
                                {servicesList.map((service) => (
                                    <MenuItem key={service.serviceId} value={service.serviceId}>
                                        {service.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha('#6366f1', 0.03), borderColor: alpha('#6366f1', 0.1) }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                                Preferencias de Disponibilidad
                            </Typography>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={anyDay}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAnyDay(true);
                                                setSelectedDays([]);
                                                setRequestedDates([]);
                                            } else {
                                                setAnyDay(false);
                                            }
                                        }}
                                        color="primary"
                                    />
                                }
                                label={<Typography variant="body2">Cualquier día de la semana</Typography>}
                            />

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                                    Días de la semana
                                </Typography>
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
                                            label={<Typography variant="body2">{day.label}</Typography>}
                                            sx={{ width: '45%' }}
                                        />
                                    ))}
                                </FormGroup>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                    Fechas Específicas (Opcional)
                                </Typography>
                                <Box sx={{ opacity: anyDay ? 0.5 : 1, pointerEvents: anyDay ? 'none' : 'auto' }}>
                                    <LocalizationProvider 
                                        dateAdapter={AdapterDateFns} 
                                        adapterLocale={locale === 'pt' ? pt : (locale === 'en' ? enUS : es)}
                                    >
                                        <Box display="flex" gap={1} mb={2} alignItems="center">
                                            <DatePicker
                                                label="Seleccionar Fecha"
                                                value={newDate}
                                                onChange={(newValue) => setNewDate(newValue)}
                                                slotProps={{
                                                    textField: {
                                                        size: 'small',
                                                        fullWidth: true
                                                    }
                                                }}
                                            />
                                            <Button 
                                                variant="outlined" 
                                                onClick={handleAddDate}
                                                disabled={!newDate}
                                                startIcon={<AddIcon />}
                                                sx={{ height: 40 }}
                                            >
                                                Añadir
                                            </Button>
                                        </Box>
                                    </LocalizationProvider>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {requestedDates.map((date) => (
                                            <Chip
                                                key={date}
                                                label={date}
                                                onDelete={() => handleRemoveDate(date)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        ))}
                                        {requestedDates.length === 0 && (
                                            <Typography variant="body2" color="textSecondary">
                                                No hay fechas específicas seleccionadas.
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
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
