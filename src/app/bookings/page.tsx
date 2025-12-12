'use client';

import * as React from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { generateClient } from 'aws-amplify/api';
import { LIST_PROVIDERS, LIST_BOOKINGS_BY_PROVIDER, CANCEL_BOOKING, SEARCH_SERVICES, CREATE_BOOKING } from '../../graphql/queries';

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
    ToggleButtonGroup,
    CircularProgress,
    FormControl
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
import AddIcon from '@mui/icons-material/Add';

// --- Types ---
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
type ViewMode = 'list' | 'calendar';

interface Booking {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string; // Added phone
    serviceName: string; // Placeholder until we fetch service details or enrichment
    providerName: string;
    start: string; // ISO Date String
    status: BookingStatus;
    notes?: string;
    providerId?: string;
}

interface Provider {
    providerId: string;
    name: string;
}

const STATUS_COLORS: Record<BookingStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'default'
};

const STATUSES = ['All', 'confirmed', 'pending', 'cancelled', 'completed'];

const client = generateClient();

export default function BookingsPage() {
    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
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
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const response: any = await client.graphql({ query: LIST_PROVIDERS });
            const fetchedProviders = response.data.listProviders;
            setProviders(fetchedProviders);
            // Fetch bookings for all providers initially
            fetchBookings(fetchedProviders);
        } catch (error) {
            console.error('Error fetching providers:', error);
            setLoading(false);
        }
    };

    const fetchBookings = async (currentProviders: Provider[]) => {
        setLoading(true);
        try {
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(); // Last month
            const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString(); // Next 2 months

            // If filterProvider is 'All', fetch for all. Else fetch for specific.
            const providersToFetch = filterProvider === 'All'
                ? currentProviders
                : currentProviders.filter(p => p.name === filterProvider);

            const allBookings: Booking[] = [];

            for (const provider of providersToFetch) {
                const response: any = await client.graphql({
                    query: LIST_BOOKINGS_BY_PROVIDER,
                    variables: {
                        input: {
                            providerId: provider.providerId,
                            startDate,
                            endDate
                        }
                    }
                });

                const providerBookings = response.data.listBookingsByProvider.map((b: any) => ({
                    id: b.bookingId,
                    clientName: b.clientName,
                    clientEmail: b.clientEmail,
                    clientPhone: b.clientPhone,
                    serviceName: b.serviceId, // TODO: Resolve Service Name
                    providerName: provider.name,
                    start: b.start,
                    status: b.status.toLowerCase() as BookingStatus,
                    notes: b.notes,
                    providerId: provider.providerId
                }));
                allBookings.push(...providerBookings);
            }

            setBookings(allBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when provider filter changes (optimization: could filter locally if we fetched all)
    // But for now let's just re-fetch to be safe and consistent with "Backend Integration" task
    React.useEffect(() => {
        if (providers.length > 0) {
            fetchBookings(providers);
        }
    }, [filterProvider, providers]);



    // New Booking State
    const [newBookingOpen, setNewBookingOpen] = React.useState(false);
    const [createLoading, setCreateLoading] = React.useState(false);
    const [newBookingData, setNewBookingData] = React.useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        serviceId: '',
        providerId: '',
        date: '',
        time: '',
        notes: ''
    });
    const [availableServices, setAvailableServices] = React.useState<{ serviceId: string, name: string, durationMinutes: number }[]>([]);

    React.useEffect(() => {
        if (newBookingOpen) {
            fetchServices();
        }
    }, [newBookingOpen]);

    const fetchServices = async () => {
        try {
            const response: any = await client.graphql({ query: SEARCH_SERVICES, variables: { text: '' } }); // Fetch all
            setAvailableServices(response.data.searchServices);
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    const handleOpenNewBooking = () => {
        // Default to a sane date/time (tomorrow 9am)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        setNewBookingData({
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            serviceId: '',
            providerId: '',
            date: tomorrow.toISOString().split('T')[0],
            time: '09:00',
            notes: ''
        });
        setNewBookingOpen(true);
    };

    const handleCreateBooking = async () => {
        setCreateLoading(true);
        try {
            const startDateTime = new Date(`${newBookingData.date}T${newBookingData.time}`);
            const service = availableServices.find(s => s.serviceId === newBookingData.serviceId);
            const duration = service ? service.durationMinutes : 60; // Default or fetched
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            await client.graphql({
                query: CREATE_BOOKING,
                variables: {
                    input: {
                        serviceId: newBookingData.serviceId,
                        providerId: newBookingData.providerId,
                        start: startDateTime.toISOString(),
                        end: endDateTime.toISOString(),
                        clientName: newBookingData.clientName,
                        clientEmail: newBookingData.clientEmail,
                        clientPhone: newBookingData.clientPhone || null,
                        notes: newBookingData.notes || null
                    }
                }
            });

            setNewBookingOpen(false);
            // Refresh list
            if (providers.length > 0) {
                fetchBookings(providers);
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Error creating booking. Please check console.');
        } finally {
            setCreateLoading(false);
        }
    };

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

    const confirmCancel = async () => {
        if (bookingToCancel) {
            try {
                await client.graphql({
                    query: CANCEL_BOOKING,
                    variables: {
                        input: {
                            bookingId: bookingToCancel.id,
                            reason: 'Cancelled by Admin'
                        }
                    }
                });

                setBookings(prev => prev.map(b =>
                    b.id === bookingToCancel.id ? { ...b, status: 'cancelled' } : b
                ));
            } catch (error) {
                console.error('Error cancelling booking:', error);
                // Optionally show error toast
            } finally {
                setConfirmOpen(false);
                setBookingToCancel(null);
                setDetailOpen(false);
            }
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
        // filterProvider is handled by fetch, but check here just in case of state lag? 
        // Actually fetch handles it. But wait, if I have 'All', fetch gets all. If I have specific, fetch gets specific.
        // So this filter check is redundant but safe.
        const matchesProvider = filterProvider === 'All' || b.providerName === filterProvider;
        const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
        return matchesProvider && matchesStatus;
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenNewBooking()}
                    >
                        New Booking
                    </Button>
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
                        disabled={loading}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {providers.map((p) => (
                            <MenuItem key={p.providerId} value={p.name}>{p.name}</MenuItem>
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
                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : viewMode === 'list' ? (
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
                                                    color={STATUS_COLORS[row.status] || 'default'}
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
                                    color={STATUS_COLORS[selectedBooking.status] || 'default'}
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

            {/* New Booking Dialog */}
            <Dialog open={newBookingOpen} onClose={() => setNewBookingOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>New Booking</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                label="Client Name"
                                fullWidth
                                value={newBookingData.clientName}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Client Email"
                                fullWidth
                                value={newBookingData.clientEmail}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientEmail: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Client Phone (Optional)"
                                fullWidth
                                value={newBookingData.clientPhone}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientPhone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                label="Service"
                                fullWidth
                                value={newBookingData.serviceId}
                                onChange={(e) => setNewBookingData({ ...newBookingData, serviceId: e.target.value })}
                            >
                                {availableServices.map((s) => (
                                    <MenuItem key={s.serviceId} value={s.serviceId}>{s.name} ({s.durationMinutes} min)</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                label="Provider"
                                fullWidth
                                value={newBookingData.providerId}
                                onChange={(e) => setNewBookingData({ ...newBookingData, providerId: e.target.value })}
                            >
                                {providers.map((p) => (
                                    <MenuItem key={p.providerId} value={p.providerId}>{p.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6} />
                        <Grid item xs={6}>
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newBookingData.date}
                                onChange={(e) => setNewBookingData({ ...newBookingData, date: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Time"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={newBookingData.time}
                                onChange={(e) => setNewBookingData({ ...newBookingData, time: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Notes"
                                fullWidth
                                multiline
                                rows={3}
                                value={newBookingData.notes}
                                onChange={(e) => setNewBookingData({ ...newBookingData, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewBookingOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBooking}
                        disabled={createLoading || !newBookingData.clientName || !newBookingData.clientEmail || !newBookingData.serviceId || !newBookingData.providerId || !newBookingData.date || !newBookingData.time}
                    >
                        {createLoading ? <CircularProgress size={24} /> : 'Create Booking'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
