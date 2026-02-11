
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Box,
    Typography,
    Divider,
    FormControl,
    InputLabel,
    Select,
    CircularProgress,
    Tabs,
    Tab,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { CREATE_CLIENT, UPDATE_CLIENT } from '../../graphql/client-queries';
import { LIST_PROVIDERS, LIST_BOOKINGS_BY_CLIENT } from '../../graphql/queries';
import { useToast } from '../common/ToastContext';

const client = generateClient();

interface ClientFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const IDENTIFIER_TYPES = [
    { value: 'RUT', label: 'RUT (Chile)' },
    { value: 'CPF', label: 'CPF (Brasil)' },
    { value: 'DNI', label: 'DNI' },
    { value: 'PASSPORT', label: 'Pasaporte' },
    { value: 'OTHER', label: 'Otro' }
];

const GENDERS = [
    { value: 'MALE', label: 'Masculino' },
    { value: 'FEMALE', label: 'Femenino' },
    { value: 'OTHER', label: 'Otro' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decirlo' }
];

export default function ClientForm({ open, onClose, onSuccess, initialData }: ClientFormProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [providers, setProviders] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [formData, setFormData] = useState({
        givenName: '',
        familyName: '',
        idType: 'RUT',
        idValue: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        occupation: '',
        insuranceProvider: '',
        insuranceType: '',
        addressText: '',
        providerIds: [] as string[]
    });

    const fetchProviders = useCallback(async () => {
        try {
            const result = await client.graphql({ query: LIST_PROVIDERS }) as any;
            setProviders(result.data.listProviders || []);
        } catch (err) {
            console.error('Error fetching providers:', err);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!initialData?.id && !formData.email) return;

        try {
            setLoadingHistory(true);
            const result = await client.graphql({
                query: LIST_BOOKINGS_BY_CLIENT,
                variables: { input: { clientEmail: formData.email } }
            }) as any;
            setHistory(result.data.listBookingsByClient || []);
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, [initialData, formData.email]);

    useEffect(() => {
        if (open) {
            fetchProviders();
            setActiveTab(0);
        }
    }, [open, fetchProviders]);

    useEffect(() => {
        if (activeTab === 1 && open) {
            fetchHistory();
        }
    }, [activeTab, open, fetchHistory]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                givenName: initialData.names?.given || '',
                familyName: initialData.names?.family || '',
                idType: initialData.identifiers?.[0]?.type || 'RUT',
                idValue: initialData.identifiers?.[0]?.value || '',
                email: initialData.contactInfo?.find((c: any) => c.system === 'email')?.value || '',
                phone: initialData.contactInfo?.find((c: any) => c.system === 'phone')?.value || '',
                birthDate: initialData.birthDate || '',
                gender: initialData.gender || '',
                occupation: initialData.occupation || '',
                insuranceProvider: initialData.healthInsurance?.provider || '',
                insuranceType: initialData.healthInsurance?.type || '',
                addressText: initialData.address?.text || '',
                providerIds: initialData.providerIds || []
            });
        } else {
            setFormData({
                givenName: '',
                familyName: '',
                idType: 'RUT',
                idValue: '',
                email: '',
                phone: '',
                birthDate: '',
                gender: '',
                occupation: '',
                insuranceProvider: '',
                insuranceType: '',
                addressText: '',
                providerIds: []
            });
        }
    }, [initialData, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name as string]: value }));
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const input: any = {
                names: {
                    given: formData.givenName,
                    family: formData.familyName
                },
                identifiers: [
                    { type: formData.idType, value: formData.idValue }
                ],
                contactInfo: [],
                providerIds: formData.providerIds
            };

            if (formData.email) {
                input.contactInfo.push({ system: 'email', value: formData.email });
            }
            if (formData.phone) {
                input.contactInfo.push({ system: 'phone', value: formData.phone });
            }

            if (formData.birthDate) input.birthDate = formData.birthDate;
            if (formData.gender) input.gender = formData.gender;
            if (formData.occupation) input.occupation = formData.occupation;

            if (formData.insuranceProvider || formData.insuranceType) {
                input.healthInsurance = {
                    provider: formData.insuranceProvider || 'N/A',
                    type: formData.insuranceType || 'N/A'
                };
            }

            if (formData.addressText) {
                input.address = {
                    text: formData.addressText
                };
            }

            if (initialData?.id) {
                await client.graphql({
                    query: UPDATE_CLIENT,
                    variables: { input: { id: initialData.id, ...input } }
                });
                showToast('Cliente actualizado correctamente');
            } else {
                await client.graphql({
                    query: CREATE_CLIENT,
                    variables: { input }
                });
                showToast('Cliente creado correctamente');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving client:', err);
            showToast(err.errors?.[0]?.message || 'Error al guardar el cliente', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 0 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {initialData ? 'Ficha de Cliente' : 'Nuevo Cliente'}
                        </Typography>
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab label="Información" />
                            <Tab label="Historial de Citas" disabled={!initialData && !formData.email} />
                        </Tabs>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {activeTab === 0 && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Información Personal
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Nombres"
                                        name="givenName"
                                        value={formData.givenName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Apellidos"
                                        name="familyName"
                                        value={formData.familyName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo Identificación</InputLabel>
                                        <Select
                                            name="idType"
                                            value={formData.idType}
                                            label="Tipo Identificación"
                                            onChange={handleChange as any}
                                        >
                                            {IDENTIFIER_TYPES.map(type => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Número Identificación"
                                        name="idValue"
                                        value={formData.idValue}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Profesionales Preferidos
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Seleccione Profesionales</InputLabel>
                                <Select
                                    multiple
                                    name="providerIds"
                                    value={formData.providerIds}
                                    label="Seleccione Profesionales"
                                    onChange={handleChange as any}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => {
                                                const p = providers.find(prov => prov.providerId === value);
                                                return <Chip key={value} label={p?.name || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {providers.map((p) => (
                                        <MenuItem key={p.providerId} value={p.providerId}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar src={p.photoUrlThumbnail} sx={{ width: 24, height: 24, mr: 1 }} />
                                                {p.name}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Contacto
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Teléfono"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>

                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Información Adicional
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Fecha de Nacimiento"
                                        name="birthDate"
                                        type="date"
                                        InputLabelProps={{ shrink: true }}
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Género</InputLabel>
                                        <Select
                                            name="gender"
                                            value={formData.gender}
                                            label="Género"
                                            onChange={handleChange as any}
                                        >
                                            {GENDERS.map(g => (
                                                <MenuItem key={g.value} value={g.value}>
                                                    {g.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Ocupación"
                                        name="occupation"
                                        value={formData.occupation}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Previsión / Seguro"
                                        name="insuranceProvider"
                                        value={formData.insuranceProvider}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Tipo de Plan"
                                        name="insuranceType"
                                        value={formData.insuranceType}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Dirección"
                                        name="addressText"
                                        multiline
                                        rows={2}
                                        value={formData.addressText}
                                        onChange={handleChange}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box sx={{ mt: 2 }}>
                            {loadingHistory ? (
                                <Box display="flex" justifyContent="center" p={5}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Fecha</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Servicio</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Profesional</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {history.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center">
                                                        <Typography py={3} color="textSecondary">
                                                            No hay citas registradas para este cliente.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                history.map((h) => (
                                                    <TableRow key={h.bookingId}>
                                                        <TableCell>{new Date(h.start).toLocaleDateString()}</TableCell>
                                                        <TableCell>{h.serviceId}</TableCell>
                                                        <TableCell>
                                                            {providers.find(p => p.providerId === h.providerId)?.name || h.providerId}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={h.status}
                                                                size="small"
                                                                color={h.status === 'CONFIRMED' ? 'success' : 'default'}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ borderTop: 1, borderColor: 'divider', p: 2 }}>
                    <Button onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || activeTab !== 0}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {initialData ? 'Actualizar' : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
