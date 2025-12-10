'use client';

import * as React from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import {
    Typography,
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    InputAdornment,
    Paper,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// --- Types ---
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
type ViewMode = 'list' | 'calendar';

interface Booking {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string; // Added phone
    serviceName: string;
    providerName: string;
    start: string; // ISO Date String
    status: BookingStatus;
    notes?: string;
}

// --- Mock Data ---
const MOCK_BOOKINGS: Booking[] = [
    {
        id: '1',
        clientName: 'Juan Pérez',
        clientEmail: 'juan@example.com',
        clientPhone: '5491112345678',
        serviceName: 'Consulta General',
        providerName: 'Dr. Mario Alvarez',
        start: '2025-12-06T10:00:00',
        status: 'confirmed',
        notes: 'Primera visita, dolor de cabeza constante.'
    },
    {
        id: '2',
        clientName: 'María Rodríguez',
        clientEmail: 'maria@example.com',
        clientPhone: '5491187654321', // Added phone
        serviceName: 'Dermatología',
        providerName: 'Dr. Mario Alvarez',
        start: '2025-12-06T11:30:00',
        status: 'pending',
    },
    {
        id: '3',
        clientName: 'Carlos López',
        clientEmail: 'carlos@example.com',
        serviceName: 'Masaje Relajante',
        providerName: 'Ana García',
        start: '2025-12-07T15:00:00',
        status: 'confirmed',
        notes: 'Prefiere presión suave.'
    },
    {
        id: '4',
        clientName: 'Luisa Mendoza',
        clientEmail: 'luisa@example.com',
        serviceName: 'Limpieza Facial',
        providerName: 'Ana García',
        start: '2025-12-05T09:00:00',
        status: 'completed',
    },
    {
        id: '5',
        clientName: 'Roberto Gómez',
        clientEmail: 'roberto@example.com',
        serviceName: 'Consulta General',
        providerName: 'Dr. Mario Alvarez',
        start: '2025-12-07T09:30:00',
        status: 'confirmed',
    },
    {
        id: '6',
        clientName: 'Elena Torres',
        clientEmail: 'elena@example.com',
        serviceName: 'Pediatría',
        providerName: 'Dr. Mario Alvarez',
        start: '2025-12-25T14:00:00',
        status: 'pending',
    }
];

const STATUS_COLORS: Record<BookingStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'default'
};

const PROVIDERS = ['All', 'Dr. Mario Alvarez', 'Ana García'];
const STATUSES = ['All', 'confirmed', 'pending', 'cancelled', 'completed'];

export default function BookingsPage() {
    const [bookings, setBookings] = React.useState<Booking[]>(MOCK_BOOKINGS);
    const [filterProvider, setFilterProvider] = React.useState('All');
    const [filterStatus, setFilterStatus] = React.useState('All');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [hasMounted, setHasMounted] = React.useState(false);
    const [sortBy, setSortBy] = React.useState<'closest' | 'furthest'>('closest');

    const getTimeRemaining = (dateString: string) => {
        const target = new Date(dateString).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff < 0) return { text: 'Ended', color: 'default' as const };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 2) return { text: `In ${Math.floor(diff / (1000 * 60))}m`, color: 'error' as const };
        if (hours < 24) return { text: `In ${hours}h`, color: 'warning' as const };
        if (days < 7) return { text: `In ${days}d`, color: 'primary' as const };

        return { text: `In ${days}d`, color: 'default' as const };
    };

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    // Detail Dialog State
    const [detailOpen, setDetailOpen] = React.useState(false);
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);

    // Confirm Dialog State
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [bookingToCancel, setBookingToCancel] = React.useState<Booking | null>(null);

    const handleViewDetail = (booking: Booking) => {
        setSelectedBooking(booking);
        setDetailOpen(true);
    };

    const handleCancelClick = (booking: Booking) => {
        setBookingToCancel(booking);
        setConfirmOpen(true);
    };

    const confirmCancel = () => {
        if (bookingToCancel) {
            setBookings(prev => prev.map(b =>
                b.id === bookingToCancel.id ? { ...b, status: 'cancelled' } : b
            ));
            setConfirmOpen(false);
            setBookingToCancel(null);

            // If viewing details of the cancelled booking, close details or update it?
            // Let's close it to be safe
            setDetailOpen(false);
        }
    };


    // Calendar State
    const [viewMode, setViewMode] = React.useState<ViewMode>('list');
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        // Adjust for Monday start (0=Sun, 1=Mon...). Request wants Mon-Sun.
        // JS getDay(): 0=Sun, 1=Mon...6=Sat.
        // We want Mon=0, Sun=6.
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<Grid item xs={1.7} key={`empty-${i}`} sx={{ height: 120, border: '1px solid #eee', bgcolor: '#fafafa' }} />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = statusFilteredBookings.filter(b => b.start.startsWith(dateStr));

            days.push(
                <Grid item xs={1.7} key={day} sx={{ height: 120, border: '1px solid #eee', p: 1, overflow: 'hidden' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{day}</Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {dayBookings.map(b => (
                            <Chip
                                key={b.id}
                                label={`${new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${b.clientName}`}
                                size="small"
                                color={STATUS_COLORS[b.status]}
                                onClick={() => handleViewDetail(b)}
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    justifyContent: 'flex-start',
                                    textTransform: 'capitalize',
                                    '& .MuiChip-label': { px: 1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }
                                }}
                            />
                        ))}
                    </Stack>
                </Grid>
            );
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button onClick={handlePrevMonth} startIcon={<ArrowBackIosNewIcon />}>Prev</Button>
                    <Typography variant="h6">
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Button onClick={handleNextMonth} endIcon={<ArrowForwardIosIcon />}>Next</Button>
                </Box>
                {/* Weekday Headers */}
                <Grid container>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <Grid item xs={1.7} key={d} sx={{ p: 1, textAlign: 'center', bgcolor: '#f5f5f5', border: '1px solid #eee' }}>
                            <Typography variant="subtitle2">{d}</Typography>
                        </Grid>
                    ))}
                    {days}
                </Grid>
            </Box>
        );
    };

    // Filter logic adjustment for Calendar: 
    // Calendar shows ALL bookings for the month but respects Provider/Status filters.
    // The previous 'filteredBookings' was global. We should use that for the list, 
    // but for Calendar we probably want all dates in that month, filtered by other criteria.
    // Let's reuse 'filteredBookings' for simplicity, assuming the list view is the source of truth for "what to see".
    // Wait, if I search term it might filter out bookings from other days. That's fine.

    // Actually, let's redefine filteredBookings to NOT include search term for simplicity in Calendar? 
    // No, consistent filtering is better. If I search "Juan", I only see Juan's bookings on the calendar.

    const statusFilteredBookings = bookings.filter(b => {
        const matchesProvider = filterProvider === 'All' || b.providerName === filterProvider;
        const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
        return matchesProvider && matchesStatus;
        // Note: I'm not using searchTerm here for the calendar to ensure the calendar looks populated 
        // as per standard UX, or should I? Let's stick to status/provider filters for calendar for now 
        // as "Search" is usually a List operation. 
        // User didn't specify, but "visual calendar" implies seeing capacity.
    });

    // Filter AND Sort Logic
    const listFilteredBookings = statusFilteredBookings.filter(b =>
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        const dateA = new Date(a.start).getTime();
        const dateB = new Date(b.start).getTime();
        return sortBy === 'closest' ? dateA - dateB : dateB - dateA;
    });

    const handleWhatsAppReminder = () => {
        if (!selectedBooking?.clientPhone) return;
        const date = new Date(selectedBooking.start).toLocaleDateString();
        const time = new Date(selectedBooking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const text = `Hola ${selectedBooking.clientName}, te recordamos tu cita de ${selectedBooking.serviceName} con ${selectedBooking.providerName} el día ${date} a las ${time}.`;
        window.open(`https://wa.me/${selectedBooking.clientPhone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <>
            <ConfirmDialog
                open={confirmOpen}
                title="Cancel Booking"
                content={`Are you sure you want to cancel the booking for ${bookingToCancel?.clientName}?`}
                confirmText="Cancel Booking"
                confirmColor="error"
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmCancel}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                <Typography variant="h4">Bookings</Typography>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(e, newView) => { if (newView) setViewMode(newView); }}
                    size="small"
                >
                    <ToggleButton value="list" aria-label="list view">
                        <TableRowsIcon />
                    </ToggleButton>
                    <ToggleButton value="calendar" aria-label="calendar view">
                        <CalendarMonthIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Card sx={{ mb: 3, p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        select
                        label="Provider"
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        sx={{ minWidth: 200 }}
                        size="small"
                    >
                        {PROVIDERS.map((p) => (
                            <MenuItem key={p} value={p}>{p}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        {STATUSES.map((s) => (
                            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Sort By"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'closest' | 'furthest')}
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="closest">Closest</MenuItem>
                        <MenuItem value="furthest">Furthest</MenuItem>
                    </TextField>

                    {viewMode === 'list' && (
                        <TextField
                            placeholder="Search client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.disabled' }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                    )}
                </Stack>
            </Card>

            <Card sx={{ p: viewMode === 'calendar' ? 2 : 0 }}>
                {viewMode === 'list' ? (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Time Left</TableCell> {/* New Column */}
                                    <TableCell>Client</TableCell>
                                    <TableCell>Service</TableCell>
                                    <TableCell>Provider</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {listFilteredBookings.map((row) => {
                                    const timeLeft = getTimeRemaining(row.start);
                                    return (
                                        <TableRow key={row.id} hover>
                                            <TableCell>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <EventIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {hasMounted ? new Date(row.start).toLocaleDateString() : row.start}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {hasMounted ? new Date(row.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                {hasMounted && row.status !== 'completed' && row.status !== 'cancelled' ? (
                                                    <Chip
                                                        label={timeLeft.text}
                                                        color={timeLeft.color}
                                                        size="small"
                                                        variant="outlined"
                                                        icon={<AccessTimeIcon />}
                                                    />
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle2">{row.clientName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{row.clientEmail}</Typography>
                                            </TableCell>
                                            <TableCell>{row.serviceName}</TableCell>
                                            <TableCell>{row.providerName}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={row.status}
                                                    color={STATUS_COLORS[row.status]}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleViewDetail(row)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleCancelClick(row)}
                                                    disabled={row.status === 'cancelled' || row.status === 'completed'}
                                                >
                                                    <BlockIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {listFilteredBookings.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                No bookings found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    renderCalendar()
                )}
            </Card>

            {/* Booking Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogContent dividers>
                    {selectedBooking && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                                <Typography variant="body1">{selectedBooking.clientName} ({selectedBooking.clientEmail})</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Date & Time</Typography>
                                <Typography variant="body1">
                                    {hasMounted ? new Date(selectedBooking.start).toLocaleString() : selectedBooking.start}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={selectedBooking.status}
                                    color={STATUS_COLORS[selectedBooking.status]}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Service</Typography>
                                <Typography variant="body1">{selectedBooking.serviceName}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
                                <Typography variant="body1">{selectedBooking.providerName}</Typography>
                            </Grid>
                            {selectedBooking.notes && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'action.hover' }}>
                                        <Typography variant="body2">{selectedBooking.notes}</Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedBooking?.clientPhone && (
                        <Button
                            startIcon={<WhatsAppIcon />}
                            color="success"
                            onClick={handleWhatsAppReminder}
                            sx={{ mr: 'auto' }}
                        >
                            WhatsApp Reminder
                        </Button>
                    )}
                    <Button onClick={() => setDetailOpen(false)}>Close</Button>
                    {selectedBooking && selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                        <Button color="error" onClick={() => { setDetailOpen(false); handleCancelClick(selectedBooking); }}>
                            Cancel Booking
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
}
