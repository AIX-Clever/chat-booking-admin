'use client';

import ConfirmDialog from '../../components/common/ConfirmDialog';
import * as React from 'react';
import { generateClient } from 'aws-amplify/api';
import { SEARCH_SERVICES, CREATE_SERVICE, UPDATE_SERVICE, DELETE_SERVICE } from '../../graphql/queries';
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
    List,
    ListItem,
    ListItemText,
    Divider,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';

// --- Types ---
interface Service {
    serviceId: string;
    name: string;
    description: string;
    durationMinutes: number;
    category: string;
    price: number;
    available: boolean;
}

const CATEGORIES = ['Medicina', 'Especialidad', 'Bienestar', 'Estética', 'General'];

const client = generateClient();

export default function ServicesPage() {
    const [services, setServices] = React.useState<Service[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [categories, setCategories] = React.useState<string[]>(CATEGORIES);

    // Dialog States
    const [open, setOpen] = React.useState(false);
    const [openCategories, setOpenCategories] = React.useState(false);

    // Confirmation Dialog State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmConfig, setConfirmConfig] = React.useState<{
        title: string;
        content: string;
        action: () => void;
    }>({ title: '', content: '', action: () => { } });

    const [currentService, setCurrentService] = React.useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [newCategory, setNewCategory] = React.useState('');

    // Form State
    const [formData, setFormData] = React.useState<Service>({
        serviceId: '',
        name: '',
        description: '',
        durationMinutes: 30,
        category: '',
        price: 0,
        available: true,
    });

    React.useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const response: any = await client.graphql({ query: SEARCH_SERVICES, variables: { text: '' } });
            setServices(response.data.searchServices);
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (service?: Service) => {
        if (service) {
            setFormData(service);
            setCurrentService(service);
        } else {
            setFormData({
                serviceId: '',
                name: '',
                description: '',
                durationMinutes: 30,
                category: categories[0] || '',
                price: 0,
                available: true,
            });
            setCurrentService(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            if (currentService) {
                // Edit
                const response: any = await client.graphql({
                    query: UPDATE_SERVICE,
                    variables: {
                        input: {
                            serviceId: currentService.serviceId,
                            name: formData.name,
                            description: formData.description,
                            category: formData.category,
                            durationMinutes: formData.durationMinutes,
                            price: formData.price,
                            available: formData.available
                        }
                    }
                });
                const updated = response.data.updateService;
                setServices((prev) =>
                    prev.map((s) => (s.serviceId === currentService.serviceId ? updated : s))
                );
            } else {
                // Create
                const response: any = await client.graphql({
                    query: CREATE_SERVICE,
                    variables: {
                        input: {
                            name: formData.name,
                            description: formData.description,
                            category: formData.category,
                            durationMinutes: formData.durationMinutes,
                            price: formData.price
                        }
                    }
                });
                const created = response.data.createService;
                // Backend default available to true usually, but checking schema
                setServices((prev) => [...prev, { ...created, available: true }]);
            }
            setOpen(false);
        } catch (error) {
            console.error('Error saving service:', error);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            title: 'Delete Service',
            content: 'Are you sure you want to delete this service? This action cannot be undone.',
            action: async () => {
                try {
                    await client.graphql({
                        query: DELETE_SERVICE,
                        variables: { serviceId: id }
                    });
                    setServices((prev) => prev.filter((s) => s.serviceId !== id));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting service:', error);
                }
            }
        });
        setConfirmOpen(true);
    };

    // --- Category Management ---
    const handleAddCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            setCategories(prev => [...prev, newCategory]);
            setNewCategory('');
        }
    };

    const handleDeleteCategory = (cat: string) => {
        setConfirmConfig({
            title: 'Delete Category',
            content: `Are you sure you want to delete the category "${cat}"?`,
            action: () => {
                setCategories(prev => prev.filter(c => c !== cat));
                setConfirmOpen(false);
            }
        });
        setConfirmOpen(true);
    };


    const filteredServices = services.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Typography variant="h4">Services</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<CategoryIcon />} onClick={() => setOpenCategories(true)}>
                        Manage Categories
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        New Service
                    </Button>
                </Box>
            </Box>

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search service..."
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

                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Duration</TableCell>
                                    <TableCell>Price</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredServices.map((row) => (
                                    <TableRow key={row.serviceId} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" noWrap>
                                                {row.name}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                                {row.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{row.category}</TableCell>
                                        <TableCell>{row.durationMinutes} min</TableCell>
                                        <TableCell>${row.price}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={row.available ? 'Active' : 'Inactive'}
                                                color={row.available ? 'success' : 'default'}
                                                size="small"
                                                variant="filled"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => handleOpen(row)} color="primary">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDelete(row.serviceId)} color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredServices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No services found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* Service Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentService ? 'Edit Service' : 'New Service'}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="Service Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Duration (min)"
                                type="number"
                                fullWidth
                                value={formData.durationMinutes}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                            />
                            <TextField
                                label="Price ($)"
                                type="number"
                                fullWidth
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            />
                        </Box>

                        <TextField
                            label="Category"
                            fullWidth
                            select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </TextField>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                />
                            }
                            label="Active Service"
                        />
                    </Box>
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

            {/* Manage Categories Dialog */}
            <Dialog open={openCategories} onClose={() => setOpenCategories(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder="New category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleAddCategory} disabled={!newCategory}>
                            Add
                        </Button>
                    </Box>
                    <Divider />
                    <List>
                        {categories.map((cat) => (
                            <ListItem
                                key={cat}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(cat)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={cat} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCategories(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
