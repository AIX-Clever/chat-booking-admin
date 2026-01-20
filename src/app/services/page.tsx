'use client';

import ConfirmDialog from '../../components/common/ConfirmDialog';
import * as React from 'react';
import { useTranslations } from 'next-intl';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { SEARCH_SERVICES, CREATE_SERVICE, UPDATE_SERVICE, DELETE_SERVICE, LIST_CATEGORIES, CREATE_CATEGORY, DELETE_CATEGORY, LIST_ROOMS } from '../../graphql/queries';
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
    Checkbox,
    FormGroup,
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
    requiredRoomIds?: string[];
    locationType?: string[];
}
interface Room {
    roomId: string;
    name: string;
    status: string;
}

interface Category {
    categoryId: string;
    name: string;
    description?: string;
    isActive: boolean;
    displayOrder: number;
}

const client = generateClient();

export default function ServicesPage() {
    const t = useTranslations('services');
    const tCommon = useTranslations('common');
    const [services, setServices] = React.useState<Service[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [rooms, setRooms] = React.useState<Room[]>([]);

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
        requiredRoomIds: [],
        locationType: ['PHYSICAL']
    });

    React.useEffect(() => {
        fetchServices();
        fetchCategories();
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_ROOMS });
            setRooms(response.data.listRooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_CATEGORIES });
            setCategories(response.data.listCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                category: categories.length > 0 ? categories[0].name : '',
                price: 0,
                available: true,
                requiredRoomIds: [],
                locationType: ['PHYSICAL']
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
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (currentService) {
                // Edit
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                            available: formData.available,
                            requiredRoomIds: formData.requiredRoomIds
                        }
                    },
                    authToken: token
                });
                const updated = response.data.updateService;
                setServices((prev) =>
                    prev.map((s) => (s.serviceId === currentService.serviceId ? updated : s))
                );
            } else {
                // Create
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response: any = await client.graphql({
                    query: CREATE_SERVICE,
                    variables: {
                        input: {
                            name: formData.name,
                            description: formData.description,
                            category: formData.category,
                            durationMinutes: formData.durationMinutes,
                            price: formData.price,
                            requiredRoomIds: formData.requiredRoomIds
                        }
                    },
                    authToken: token
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
            title: t('deleteService'),
            content: t('deleteConfirmation'),
            action: async () => {
                try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();

                    await client.graphql({
                        query: DELETE_SERVICE,
                        variables: { serviceId: id },
                        authToken: token
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
    const handleAddCategory = async () => {
        if (newCategory) {
            try {
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response: any = await client.graphql({
                    query: CREATE_CATEGORY,
                    variables: {
                        input: {
                            name: newCategory,
                            description: '',
                            displayOrder: categories.length + 1
                        }
                    },
                    authToken: token
                });
                const created = response.data.createCategory;
                setCategories(prev => [...prev, created]);
                setNewCategory('');
            } catch (error) {
                console.error('Error creating category:', error);
            }
        }
    };

    const handleDeleteCategory = (category: Category) => {
        setConfirmConfig({
            title: t('deleteCategoryTitle'),
            content: t('deleteCategoryConfirmation', { name: category.name }),
            action: async () => {
                try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();

                    await client.graphql({
                        query: DELETE_CATEGORY,
                        variables: { categoryId: category.categoryId },
                        authToken: token
                    });
                    setCategories(prev => prev.filter(c => c.categoryId !== category.categoryId));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting category:', error);
                }
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
                <Typography variant="h4">{t('title')}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<CategoryIcon />} onClick={() => setOpenCategories(true)}>
                        {t('category')}
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        {t('addService')}
                    </Button>
                </Box>
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

                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('name')}</TableCell>
                                    <TableCell>{t('category')}</TableCell>
                                    <TableCell>{t('duration')}</TableCell>
                                    <TableCell>{t('price')}</TableCell>
                                    <TableCell>{t('status')}</TableCell>
                                    <TableCell align="right">{tCommon('actions')}</TableCell>
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
                                                label={row.available ? t('active') : t('inactive')}
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
                                                {t('noServicesFound')}
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
                <DialogTitle>{currentService ? t('editService') : t('newService')}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label={t('serviceName')}
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label={t('description')}
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label={t('durationMin')}
                                type="number"
                                fullWidth
                                value={formData.durationMinutes || ''}
                                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                                onFocus={(e) => e.target.select()}
                            />
                            <TextField
                                label={t('priceLabel')}
                                type="number"
                                fullWidth
                                placeholder="0"
                                value={formData.price || ''}
                                onChange={(e) => {
                                    // Strip leading zero if followed by a digit (e.g. "04" -> "4")
                                    const val = e.target.value.replace(/^0+(?=\d)/, '');
                                    setFormData({ ...formData, price: val === '' ? 0 : Number(val) });
                                }}
                                onFocus={(e) => e.target.select()}
                            />
                        </Box>

                        <TextField
                            label={t('category')}
                            fullWidth
                            select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            {categories.map((option) => (
                                <MenuItem key={option.categoryId} value={option.name}>
                                    {option.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">Modality</Typography>
                            <FormGroup row>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.locationType?.includes('ONLINE') || false}
                                            onChange={(e) => {
                                                const current = formData.locationType || [];
                                                const newType = e.target.checked
                                                    ? [...current, 'ONLINE']
                                                    : current.filter(t => t !== 'ONLINE');
                                                setFormData({ ...formData, locationType: newType });
                                            }}
                                        />
                                    }
                                    label="Online"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.locationType?.includes('PHYSICAL') || false}
                                            onChange={(e) => {
                                                const current = formData.locationType || [];
                                                const newType = e.target.checked
                                                    ? [...current, 'PHYSICAL']
                                                    : current.filter(t => t !== 'PHYSICAL');
                                                setFormData({ ...formData, locationType: newType });
                                            }}
                                        />
                                    }
                                    label="Physical (In-Person)"
                                />
                            </FormGroup>
                        </Box>

                        {formData.locationType?.includes('PHYSICAL') && (
                            <TextField
                                label="Required Rooms (Optional)"
                                select
                                fullWidth
                                SelectProps={{
                                    multiple: true,
                                    renderValue: (selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={rooms.find(r => r.roomId === value)?.name || value} />
                                            ))}
                                        </Box>
                                    )
                                }}
                                value={formData.requiredRoomIds || []}
                                onChange={(e) => {
                                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                    setFormData({ ...formData, requiredRoomIds: val as string[] });
                                }}
                            >
                                {rooms.map((room) => (
                                    <MenuItem key={room.roomId} value={room.roomId}>
                                        {room.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.available}
                                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                                />
                            }
                            label={t('activeService')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.name}>
                        {tCommon('save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Manage Categories Dialog */}
            <Dialog open={openCategories} onClose={() => setOpenCategories(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('manageCategories')}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <TextField
                            size="small"
                            fullWidth
                            placeholder={t('newCategoryPlaceholder')}
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button variant="contained" onClick={handleAddCategory} disabled={!newCategory}>
                            {t('add')}
                        </Button>
                    </Box>
                    <Divider />
                    <List>
                        {categories.map((cat) => (
                            <ListItem
                                key={cat.categoryId}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(cat)}>
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemText primary={cat.name} />
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCategories(false)}>{tCommon('close')}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
