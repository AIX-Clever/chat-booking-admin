'use client';

import ConfirmDialog from '../../components/common/ConfirmDialog';
import * as React from 'react';
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
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CategoryIcon from '@mui/icons-material/Category';

// --- Types ---
interface Service {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    category: string;
    price: number;
    active: boolean;
}

// --- Mock Data ---
const MOCK_SERVICES: Service[] = [
    { id: '1', name: 'Consulta General', description: 'Evaluación inicial del paciente', durationMinutes: 15, category: 'Medicina', price: 0, active: true },
    { id: '2', name: 'Dermatología', description: 'Consulta especialista piel', durationMinutes: 30, category: 'Especialidad', price: 50, active: true },
    { id: '3', name: 'Masaje Relajante', description: 'Terapia manual completa', durationMinutes: 60, category: 'Bienestar', price: 80, active: true },
    { id: '4', name: 'Limpieza Facial', description: 'Tratamiento profundo', durationMinutes: 45, category: 'Estética', price: 40, active: false },
];

const MOCK_CATEGORIES = ['Medicina', 'Especialidad', 'Bienestar', 'Estética'];

export default function ServicesPage() {
    const [services, setServices] = React.useState<Service[]>(MOCK_SERVICES);
    const [categories, setCategories] = React.useState<string[]>(MOCK_CATEGORIES);

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
        id: '',
        name: '',
        description: '',
        durationMinutes: 30,
        category: '',
        price: 0,
        active: true,
    });

    const handleOpen = (service?: Service) => {
        if (service) {
            setFormData(service);
            setCurrentService(service);
        } else {
            setFormData({
                id: '',
                name: '',
                description: '',
                durationMinutes: 30,
                category: categories[0] || '',
                price: 0,
                active: true,
            });
            setCurrentService(null);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        if (currentService) {
            // Edit
            setServices((prev) =>
                prev.map((s) => (s.id === currentService.id ? { ...formData, id: currentService.id } : s))
            );
        } else {
            // Create
            setServices((prev) => [
                ...prev,
                { ...formData, id: Math.random().toString(36).substr(2, 9) },
            ]);
        }
        setOpen(false);
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            title: 'Delete Service',
            content: 'Are you sure you want to delete this service? This action cannot be undone.',
            action: () => {
                setServices((prev) => prev.filter((s) => s.id !== id));
                setConfirmOpen(false);
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
                                <TableRow key={row.id} hover>
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
                                        <IconButton size="small" onClick={() => handleDelete(row.id)} color="error">
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
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
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
