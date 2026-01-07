'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Tooltip,
    InputAdornment,
    Switch,
    FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslations } from 'next-intl';
import { GraphQLRoomRepository } from '@/repositories/GraphQLRoomRepository';
import { Room, CreateRoomInput } from '@/domain/Room';

const roomRepository = new GraphQLRoomRepository();

export default function RoomsPage() {
    const t = useTranslations('rooms');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState<CreateRoomInput>({
        name: '',
        description: '',
        capacity: 1,
        status: 'ACTIVE',
        isVirtual: false,
        minDuration: 30,
        maxDuration: 120,
        operatingHours: []
    });
    // Temporary state for JSON editing
    const [operatingHoursJson, setOperatingHoursJson] = useState('[]');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const loadRooms = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await roomRepository.listRooms();
            setRooms(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(t('errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    const handleOpenCreate = () => {
        setDialogMode('create');
        setFormData({
            name: '',
            description: '',
            capacity: 1,
            status: 'ACTIVE',
            isVirtual: false,
            minDuration: 30,
            maxDuration: 120,
            operatingHours: []
        });
        setOperatingHoursJson('[]');
        setSelectedRoom(null);
        setOpenDialog(true);
    };

    const handleOpenEdit = (room: Room) => {
        setDialogMode('edit');
        setFormData({
            name: room.name,
            description: room.description || '',
            capacity: room.capacity || 1,
            status: room.status,
            isVirtual: room.isVirtual || false,
            minDuration: room.minDuration || 30,
            maxDuration: room.maxDuration || 120,
            operatingHours: room.operatingHours || []
        });
        setOperatingHoursJson(JSON.stringify(room.operatingHours || [], null, 2));
        setSelectedRoom(room);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setIsSubmitting(false);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            if (dialogMode === 'create') {
                await roomRepository.createRoom({
                    ...formData,
                    operatingHours: JSON.parse(operatingHoursJson || '[]')
                });
            } else if (dialogMode === 'edit' && selectedRoom) {
                await roomRepository.updateRoom({
                    roomId: selectedRoom.roomId,
                    ...formData,
                    operatingHours: JSON.parse(operatingHoursJson || '[]')
                });
            }
            await loadRooms();
            handleCloseDialog();
        } catch (err) {
            console.error(err);
            setError(dialogMode === 'create' ? t('errors.createFailed') : t('errors.updateFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (roomId: string) => {
        setDeleteId(roomId);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await roomRepository.deleteRoom(deleteId);
            await loadRooms();
            setDeleteId(null);
        } catch (err) {
            console.error(err);
            setError(t('errors.deleteFailed'));
        }
    };

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">{t('title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                >
                    {t('addRoom')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Buscar sala..."
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('fields.name')}</TableCell>
                                    <TableCell>{t('fields.description')}</TableCell>
                                    <TableCell>{t('fields.capacity')}</TableCell>
                                    <TableCell>{t('fields.status')}</TableCell>
                                    <TableCell align="right">{t('actions.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRooms.map((room) => (
                                    <TableRow key={room.roomId} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" noWrap>
                                                {room.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                                                {room.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {room.capacity}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={room.status === 'ACTIVE' ? t('fields.active') : t('fields.inactive')}
                                                color={room.status === 'ACTIVE' ? 'success' : 'default'}
                                                size="small"
                                                variant="filled"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('actions.edit')}>
                                                <IconButton onClick={() => handleOpenEdit(room)} size="small" color="primary">
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('actions.delete')}>
                                                <IconButton onClick={() => handleDeleteClick(room.roomId)} size="small" color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredRooms.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                {t('errors.loadFailed').includes('Failed') ? 'No rooms found' : 'No se encontraron salas'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'create' ? t('addRoom') : t('editRoom')}
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label={t('fields.name')}
                            fullWidth
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label={t('fields.description')}
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label={t('fields.capacity')}
                                type="number"
                                fullWidth
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                            />
                            <FormControl fullWidth>
                                <InputLabel>{t('fields.status')}</InputLabel>
                                <Select
                                    value={formData.status}
                                    label={t('fields.status')}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                >
                                    <MenuItem value="ACTIVE">{t('fields.active')}</MenuItem>
                                    <MenuItem value="INACTIVE">{t('fields.inactive')}</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.isVirtual || false}
                                        onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                                    />
                                }
                                label="Is Virtual Room (Unlimited Capacity, No Collisions)"
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <TextField
                                label="Min Duration (min)"
                                type="number"
                                fullWidth
                                value={formData.minDuration}
                                onChange={(e) => setFormData({ ...formData, minDuration: Number(e.target.value) })}
                            />
                            <TextField
                                label="Max Duration (min)"
                                type="number"
                                fullWidth
                                value={formData.maxDuration}
                                onChange={(e) => setFormData({ ...formData, maxDuration: Number(e.target.value) })}
                            />
                        </Box>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Operating Hours (JSON Format: <code>[{'{'}&quot;day&quot;: &quot;MON&quot;, &quot;start&quot;: &quot;09:00&quot;, &quot;end&quot;: &quot;18:00&quot;{'}'}]</code>)
                            </Typography>
                            <TextField
                                multiline
                                rows={4}
                                fullWidth
                                value={operatingHoursJson}
                                onChange={(e) => setOperatingHoursJson(e.target.value)}
                                sx={{ mt: 1, fontFamily: 'monospace' }}
                            />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseDialog} color="inherit">
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting || !formData.name}
                    >
                        {isSubmitting ? 'Saving...' : t('actions.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
                <DialogTitle>{t('actions.delete')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('actions.confirmDelete')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteId(null)}>{t('actions.cancel')}</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        {t('actions.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
