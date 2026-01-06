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
    Paper,
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
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
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
        status: 'ACTIVE'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
            status: 'ACTIVE'
        });
        setSelectedRoom(null);
        setOpenDialog(true);
    };

    const handleOpenEdit = (room: Room) => {
        setDialogMode('edit');
        setFormData({
            name: room.name,
            description: room.description || '',
            capacity: room.capacity || 1,
            status: room.status
        });
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
                await roomRepository.createRoom(formData);
            } else if (dialogMode === 'edit' && selectedRoom) {
                await roomRepository.updateRoom({
                    roomId: selectedRoom.roomId,
                    ...formData
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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                        <MeetingRoomIcon fontSize="large" color="primary" />
                        {t('title')}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {t('subtitle')}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        borderRadius: 2
                    }}
                >
                    {t('addRoom')}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Card sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                }}>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'background.default' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('fields.name')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('fields.description')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('fields.capacity')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('fields.status')}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{t('actions.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rooms.map((room) => (
                                    <TableRow key={room.roomId} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{room.name}</TableCell>
                                        <TableCell>{room.description}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={room.capacity}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={room.status === 'ACTIVE' ? t('fields.active') : t('fields.inactive')}
                                                color={room.status === 'ACTIVE' ? 'success' : 'default'}
                                                size="small"
                                                sx={{ borderRadius: 1 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('actions.edit')}>
                                                <IconButton onClick={() => handleOpenEdit(room)} size="small" color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('actions.delete')}>
                                                <IconButton onClick={() => handleDeleteClick(room.roomId)} size="small" color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {rooms.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            {t('errors.loadFailed').includes('Failed') ? 'No rooms found' : 'No se encontraron salas'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

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
