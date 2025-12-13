'use client';

import * as React from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { generateClient } from 'aws-amplify/api';
import { LIST_PROVIDERS, CREATE_PROVIDER, UPDATE_PROVIDER, DELETE_PROVIDER, SEARCH_SERVICES } from '../../graphql/queries';
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
    Paper,
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
    Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

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
    avatarUrl?: string;
    aiDrivers: {
        traits: string[];
        languages: string[];
        specialties: string[];
    };
}

// --- Mock Data ---
const client = generateClient();

// Replicating some services for assignment
const MOCK_AVAILABLE_SERVICES: Service[] = [
    { id: '1', name: 'Consulta General' },
    { id: '2', name: 'Dermatología' },
    { id: '3', name: 'Masaje Relajante' },
    { id: '4', name: 'Limpieza Facial' },
    { id: '5', name: 'Pediatría' },
];

const MOCK_PROVIDERS: Provider[] = [
    {
        id: '1',
        name: 'Dr. Mario Alvarez',
        bio: 'Médico cirujano con 10 años de experiencia.',
        serviceIds: ['1', '2'],
        timezone: 'America/Santiago',
        active: true,
        aiDrivers: {
            traits: ['Empático', 'Detallista', 'Formal'],
            languages: ['Español', 'Inglés'],
            specialties: ['Cirugía menor', 'Acné severo']
        }
    },
    {
        id: '2',
        name: 'Ana García',
        bio: 'Especialista en terapias de relajación y bienestar.',
        serviceIds: ['3', '4'],
        timezone: 'America/Buenos_Aires',
        active: true,
        aiDrivers: {
            traits: ['Calmada', 'Paciente', 'Holística'],
            languages: ['Español', 'Portugués'],
            specialties: ['Aromaterapia', 'Masaje descontracturante']
        }
    },
];

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
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [availableServices, setAvailableServices] = React.useState<Service[]>([]);
    const [open, setOpen] = React.useState(false);
    const [currentProvider, setCurrentProvider] = React.useState<Provider | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Tab State
    const [tabValue, setTabValue] = React.useState(0);

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
        aiDrivers: {
            traits: [],
            languages: ['Español'],
            specialties: []
        }
    });

    React.useEffect(() => {
        fetchProviders();
        fetchServices();
    }, []);

    const fetchProviders = async () => {
        try {
            const response: any = await client.graphql({ query: LIST_PROVIDERS });
            // Map backend response to local state if needed, or adjust types
            // Backend returns: providerId, name, timezone, available. Bio & serviceIds might be missing in list? 
            // The LIST_PROVIDERS query in queries.ts only has { providerId, name, timezone, available }. 
            // We might need to update the query to get more details or fetch detail on open.
            // For now let's work with what we have and assume bio/services might be empty on list.
            const fetched = response.data.listProviders.map((p: any) => ({
                id: p.providerId,
                name: p.name,
                bio: p.bio || '', // Handle missing fields gracefully
                serviceIds: p.serviceIds || [],
                timezone: p.timezone,
                active: p.available,
                aiDrivers: { traits: [], languages: ['Español'], specialties: [] } // Defaults for now
            }));
            setProviders(fetched);
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const response: any = await client.graphql({ query: SEARCH_SERVICES, variables: { text: '' } });
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
                aiDrivers: {
                    traits: [],
                    languages: ['Español'],
                    specialties: []
                }
            });
            setCurrentProvider(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            if (currentProvider) {
                // Update
                const input = {
                    providerId: currentProvider.id,
                    name: formData.name,
                    bio: formData.bio,
                    serviceIds: formData.serviceIds,
                    timezone: formData.timezone,
                    available: formData.active
                };

                await client.graphql({
                    query: UPDATE_PROVIDER,
                    variables: { input }
                });
            } else {
                // Create
                const input = {
                    name: formData.name,
                    bio: formData.bio,
                    serviceIds: formData.serviceIds,
                    timezone: formData.timezone
                };

                await client.graphql({
                    query: CREATE_PROVIDER,
                    variables: { input }
                });
            }
            fetchProviders(); // Refresh list
            setOpen(false);
        } catch (error) {
            console.error('Error saving provider:', error);
            alert('Failed to save provider. Please check console.');
        }
    };

    const handleDelete = (id: string, name: string) => {
        setConfirmConfig({
            title: 'Delete Provider',
            content: `Are you sure you want to delete ${name}? They will be removed from all future bookings.`,
            action: async () => {
                try {
                    await client.graphql({
                        query: DELETE_PROVIDER,
                        variables: { providerId: id }
                    });
                    setProviders((prev) => prev.filter((p) => p.id !== id));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting provider:', error);
                    alert('Failed to delete provider.');
                }
            }
        });
        setConfirmOpen(true);
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">Providers</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    New Provider
                </Button>
            </Box>

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search provider..."
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
                                <TableCell>Name</TableCell>
                                <TableCell>Assigned Services</TableCell>
                                <TableCell>AI Drivers</TableCell>
                                <TableCell>Timezone</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProviders.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={2}>
                                            <Avatar alt={row.name} src={row.avatarUrl} >{row.name.charAt(0)}</Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" noWrap>
                                                    {row.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 200 }} noWrap>
                                                    {row.bio}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {row.serviceIds.length > 0 ? (
                                                <>
                                                    <Chip label={`${row.serviceIds.length} Services`} size="small" variant="outlined" />
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
                                    <TableCell>{row.timezone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.active ? 'Active' : 'Inactive'}
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
                                            No providers found.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentProvider ? 'Edit Provider' : 'New Provider'}</DialogTitle>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="provider tabs">
                        <Tab label="General" />
                        <Tab label="Services" />
                        <Tab label="AI Context" />
                    </Tabs>
                </Box>
                <DialogContent dividers={false} sx={{ minHeight: 320 }}>

                    {/* Tab 1: General */}
                    <CustomTabPanel value={tabValue} index={0}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                label="Full Name"
                                fullWidth
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <TextField
                                label="Biography"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                            <TextField
                                label="Timezone"
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
                                label={formData.active ? "Provider is Active" : "Provider is Inactive"}
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
                                        label="Assigned Services"
                                        placeholder="Select services"
                                        helperText="Services this provider is qualified to perform."
                                    />
                                )}
                            />
                            <Typography variant="body2" color="text.secondary">
                                Assign specific services to ensure this provider only receives relevant bookings.
                            </Typography>
                        </Box>
                    </CustomTabPanel>

                    {/* Tab 3: AI Context */}
                    <CustomTabPanel value={tabValue} index={2}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                                        label="Personality Traits"
                                        placeholder="e.g. Patient, Energetic"
                                        helperText="Adjectives that describe the provider's style."
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
                                        label="Granular Specialties"
                                        placeholder="e.g. Back pain, Social anxiety"
                                        helperText="Specific conditions or areas of expertise."
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
                                        label="Languages"
                                        placeholder="Select or type languages"
                                    />
                                )}
                            />
                        </Box>
                    </CustomTabPanel>

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
