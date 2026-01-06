'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LIST_PROVIDERS, LIST_BOOKINGS_BY_PROVIDER, CANCEL_BOOKING, SEARCH_SERVICES, CREATE_BOOKING, CONFIRM_BOOKING, MARK_AS_NO_SHOW, UPDATE_BOOKING_STATUS } from '../../graphql/queries';

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
    // FormControl // Unused

} from '@mui/material';
import { DatePicker, TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import RefreshIcon from '@mui/icons-material/Refresh';

// --- Types ---
type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
type ViewMode = 'list' | 'calendar' | 'week';

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
    completed: 'info',
    no_show: 'default'
};

const STATUSES = ['All', 'confirmed', 'pending', 'cancelled', 'completed', 'no_show'];

const client = generateClient();

export default function BookingsPage() {
    const t = useTranslations('bookings');
    const tCommon = useTranslations('common');
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

        if (diff < 0) return { text: t('timeLeft.ended'), color: 'default' as const };

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        const minutes = Math.floor(diff / (1000 * 60));

        if (hours < 2) return { text: t('timeLeft.inMinutes', { minutes }), color: 'error' as const };
        if (hours < 24) return { text: t('timeLeft.inHours', { hours }), color: 'warning' as const };
        if (days < 7) return { text: t('timeLeft.inDays', { days }), color: 'primary' as const };

        return { text: t('timeLeft.inDays', { days }), color: 'default' as const };
    };

    React.useEffect(() => {
        setHasMounted(true);
        fetchServices();
        fetchProviders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProviders = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                console.log('DEBUG: Fetching bookings for:', {
                    providerId: provider.providerId,
                    startDate,
                    endDate,
                    tz: Intl.DateTimeFormat().resolvedOptions().timeZone
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const providerBookings = response.data.listBookingsByProvider.map((b: any) => ({
                    id: b.bookingId,
                    clientName: b.clientName,
                    clientEmail: b.clientEmail,
                    clientPhone: b.clientPhone,
                    serviceName: b.serviceId, // Storing ID here, resolved in render
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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


    const fetchServices = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

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
                },
                authToken: token
            });

            setNewBookingOpen(false);
            // Refresh list
            if (providers.length > 0) {
                fetchBookings(providers);
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert(tCommon('error'));
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
                // Securely fetch ID Token to ensure custom:tenantId claim is present
                const session = await fetchAuthSession();
                const token = session.tokens?.idToken?.toString();

                await client.graphql({
                    query: CANCEL_BOOKING,
                    variables: {
                        input: {
                            bookingId: bookingToCancel.id,
                            reason: 'Cancelled by Admin'
                            // tenantId removed: relying on secure token claims
                        }
                    },
                    authToken: token // Explicit secure token
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

    const handleConfirmBooking = async (booking: Booking) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: CONFIRM_BOOKING,
                variables: { input: { bookingId: booking.id } },
                authToken: token
            });
            setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'confirmed' } : b));
            if (selectedBooking?.id === booking.id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'confirmed' } : null);
            }
        } catch (error) {
            console.error('Error confirming booking:', error);
        }
    };

    const handleNoShowBooking = async (booking: Booking) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: MARK_AS_NO_SHOW,
                variables: { input: { bookingId: booking.id } },
                authToken: token
            });
            setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'no_show' } : b));
            if (selectedBooking?.id === booking.id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'no_show' } : null);
            }
        } catch (error) {
            console.error('Error marking as no show:', error);
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
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const handlePrev = () => {
        if (viewMode === 'calendar') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (viewMode === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentDate(newDate);
        }
    };

    const handleNext = () => {
        if (viewMode === 'calendar') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (viewMode === 'week') {
            const newDate = new Date(currentDate);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentDate(newDate);
        }
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
                    <Button onClick={handlePrev} startIcon={<ArrowBackIosNewIcon />}>{t('actions.prev')}</Button>
                    <Typography variant="h6">
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Button onClick={handleNext} endIcon={<ArrowForwardIosIcon />}>{t('actions.next')}</Button>
                </Box>
                {/* Weekday Headers */}
                <Grid container>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <Grid item xs={1.7} key={d} sx={{ p: 1, textAlign: 'center', bgcolor: '#f5f5f5', border: '1px solid #eee' }}>
                            <Typography variant="subtitle2">{t(`availability.days.${d.toLowerCase()}`).substring(0, 3)}</Typography>
                        </Grid>
                    ))}
                    {days}
                </Grid>
            </Box>
        );
    };

    const renderWeekCalendar = () => {
        // Find Monday of the current week
        const currentDay = currentDate.getDay();
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const monday = new Date(currentDate);
        monday.setDate(currentDate.getDate() - distanceToMonday);

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            weekDays.push(d);
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button onClick={handlePrev} startIcon={<ArrowBackIosNewIcon />}>{t('actions.prev')}</Button>
                    <Typography variant="h6">
                        {`Semana del ${monday.getDate()} de ${monday.toLocaleDateString('default', { month: 'long' })}`}
                    </Typography>
                    <Button onClick={handleNext} endIcon={<ArrowForwardIosIcon />}>{t('actions.next')}</Button>
                </Box>
                <Grid container spacing={1}>
                    {weekDays.map((dayDate) => {
                        const dateStr = dayDate.toISOString().split('T')[0];
                        const dayBookings = statusFilteredBookings.filter(b => b.start.startsWith(dateStr))
                            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                            <Grid item xs={1.7} key={dateStr} sx={{ minHeight: 300, border: '1px solid #eee', p: 1, bgcolor: isToday ? '#f0f7ff' : 'white' }}>
                                <Typography variant="subtitle2" align="center" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    {dayDate.toLocaleDateString('default', { weekday: 'short' })} {dayDate.getDate()}
                                </Typography>
                                <Stack spacing={1}>
                                    {dayBookings.map(b => (
                                        <Paper
                                            key={b.id}
                                            elevation={1}
                                            sx={{
                                                p: 1,
                                                borderLeft: `4px solid ${STATUS_COLORS[b.status] === 'success' ? '#2e7d32' : STATUS_COLORS[b.status] === 'warning' ? '#ed6c02' : '#d32f2f'}`,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: '#f5f5f5' }
                                            }}
                                            onClick={() => handleViewDetail(b)}
                                        >
                                            <Typography variant="caption" display="block" fontWeight="bold">
                                                {new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                            <Typography variant="body2" noWrap title={b.clientName}>
                                                {b.clientName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" noWrap>
                                                {availableServices.find(s => s.serviceId === b.serviceName)?.name || b.serviceName}
                                            </Typography>
                                        </Paper>
                                    ))}
                                    {dayBookings.length === 0 && (
                                        <Typography variant="caption" color="text.disabled" align="center" sx={{ mt: 2, display: 'block' }}>
                                            Sin reservas
                                        </Typography>
                                    )}
                                </Stack>
                            </Grid>
                        );
                    })}
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
                title={t('dialogs.cancelTitle')}
                content={t('dialogs.cancelContent', { name: bookingToCancel?.clientName })}
                confirmText={t('actions.cancelBooking')}
                confirmColor="error"
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmCancel}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
                <Typography variant="h4">{t('title')}</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenNewBooking()}
                    >
                        {t('newBooking')}
                    </Button>
                    <IconButton
                        onClick={() => fetchBookings(providers)}
                        disabled={loading}
                        color="primary"
                        title="Refresh"
                    >
                        <RefreshIcon />
                    </IconButton>
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
                        <ToggleButton value="week" aria-label="week view">
                            <CalendarViewWeekIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>

            <Card sx={{ mb: 3, p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        select
                        label={t('filters.all')}
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        sx={{ minWidth: 200 }}
                        size="small"
                        disabled={loading}
                    >
                        <MenuItem value="All">{t('filters.all')}</MenuItem>
                        {providers.map((p) => (
                            <MenuItem key={p.providerId} value={p.name}>{p.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label={t('columns.status')}
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
                        label={t('sorting.label')}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'closest' | 'furthest')}
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="closest">{t('sorting.closest')}</MenuItem>
                        <MenuItem value="furthest">{t('sorting.furthest')}</MenuItem>
                    </TextField>

                    {viewMode === 'list' && (
                        <TextField
                            placeholder={t('searchPlaceholder')}
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
                                    <TableCell>{t('columns.date')}</TableCell>
                                    <TableCell>{t('timeLeft.header')}</TableCell>
                                    <TableCell>{t('columns.customer')}</TableCell>
                                    <TableCell>{t('columns.service')}</TableCell>
                                    <TableCell>{t('columns.provider')}</TableCell>
                                    <TableCell>{t('columns.status')}</TableCell>
                                    <TableCell align="right">{t('columns.actions')}</TableCell>
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
                                            <TableCell>
                                                {availableServices.find(s => s.serviceId === row.serviceName)?.name || availableServices.find(s => s.serviceId === (row as unknown as { serviceId: string }).serviceId)?.name || row.serviceName}
                                            </TableCell>
                                            <TableCell>{row.providerName}</TableCell>
                                            <TableCell>
                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                <Chip
                                                    label={row.status === 'no_show' ? 'No Show' : t(`status.${row.status}`)}
                                                    color={STATUS_COLORS[row.status] || 'default'}
                                                    size="small"
                                                    sx={{ textTransform: 'capitalize' }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleViewDetail(row)}>
                                                    <VisibilityIcon />
                                                </IconButton>
                                                {row.status === 'pending' && (
                                                    <IconButton size="small" color="success" onClick={() => handleConfirmBooking(row)}>
                                                        <CheckCircleIcon />
                                                    </IconButton>
                                                )}
                                                <IconButton
                                                    size="small"
                                                    color="default"
                                                    onClick={() => handleNoShowBooking(row)}
                                                    disabled={['cancelled', 'completed', 'no_show'].includes(row.status)}
                                                >
                                                    <PersonOffIcon />
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
                                                {t('noBookingsFound')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : viewMode === 'calendar' ? (
                    renderCalendar()
                ) : (
                    renderWeekCalendar()
                )}
            </Card>

            {/* Booking Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t('dialogs.detailsTitle')}
                    {selectedBooking?.clientPhone && (
                        <Button
                            startIcon={<WhatsAppIcon />}
                            color="success"
                            variant="outlined"
                            size="small"
                            onClick={handleWhatsAppReminder}
                        >
                            {t('actions.whatsAppReminder')}
                        </Button>
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedBooking && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">{t('columns.customer')}</Typography>
                                <Typography variant="body1">{selectedBooking.clientName} ({selectedBooking.clientEmail})</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">{t('form.dateTime')}</Typography>
                                <Typography variant="body1">
                                    {hasMounted ? new Date(selectedBooking.start).toLocaleString() : selectedBooking.start}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">{t('columns.status')}</Typography>
                                <Chip
                                    label={t(`status.${selectedBooking.status}`)}
                                    color={STATUS_COLORS[selectedBooking.status] || 'default'}
                                    size="small"
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">{t('form.service')}</Typography>
                                <Typography variant="body1">
                                    {availableServices.find(s => s.serviceId === selectedBooking.serviceName)?.name || selectedBooking.serviceName}
                                </Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">{t('form.provider')}</Typography>
                                <Typography variant="body1">{selectedBooking.providerName}</Typography>
                            </Grid>
                            {selectedBooking.notes && (
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">{t('form.notes')}</Typography>
                                    <Paper variant="outlined" sx={{ p: 1, bgcolor: 'action.hover' }}>
                                        <Typography variant="body2">{selectedBooking.notes}</Typography>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
                    <Button onClick={() => setDetailOpen(false)}>{tCommon('close')}</Button>

                    {selectedBooking && (
                        <TextField
                            select
                            label={t('columns.status')}
                            value={selectedBooking.status}
                            onChange={async (e) => {
                                const newStatus = e.target.value as BookingStatus;
                                if (!selectedBooking) return;

                                // Update local state immediately for responsiveness
                                setSelectedBooking({ ...selectedBooking, status: newStatus });

                                try {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    await client.graphql({
                                        query: UPDATE_BOOKING_STATUS,
                                        variables: {
                                            bookingId: selectedBooking.id,
                                            status: newStatus.toUpperCase()
                                        }
                                    });
                                    // Refresh list in background
                                    fetchBookings(providers);
                                } catch (err) {
                                    console.error("Error updating status", err);
                                    // Revert on error (optional, but good UX)
                                    alert(tCommon('error'));
                                }
                            }}
                            size="small"
                            sx={{ minWidth: 150 }}
                        >
                            {STATUSES.map(s => (
                                <MenuItem key={s} value={s}>{t(`status.${s}`)}</MenuItem>
                            ))}
                        </TextField>
                    )}
                </DialogActions>
            </Dialog>

            {/* New Booking Dialog */}
            <Dialog open={newBookingOpen} onClose={() => setNewBookingOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('dialogs.newBookingTitle')}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ pt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                label={t('form.clientName')}
                                fullWidth
                                value={newBookingData.clientName}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label={t('form.clientEmail')}
                                fullWidth
                                value={newBookingData.clientEmail}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientEmail: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label={t('form.clientPhone')}
                                fullWidth
                                value={newBookingData.clientPhone}
                                onChange={(e) => setNewBookingData({ ...newBookingData, clientPhone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                label={t('form.service')}
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
                                label={t('form.provider')}
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
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label={t('form.date')}
                                    value={newBookingData.date ? new Date(newBookingData.date + 'T00:00:00') : null}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            const dateStr = newValue.toISOString().split('T')[0];
                                            setNewBookingData({ ...newBookingData, date: dateStr });
                                        }
                                    }}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                    label={t('form.time')}
                                    value={newBookingData.time ? new Date(`2000-01-01T${newBookingData.time}:00`) : null}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            const hours = String(newValue.getHours()).padStart(2, '0');
                                            const minutes = String(newValue.getMinutes()).padStart(2, '0');
                                            setNewBookingData({ ...newBookingData, time: `${hours}:${minutes}` });
                                        }
                                    }}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label={t('form.notes')}
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
                    <Button onClick={() => setNewBookingOpen(false)}>{tCommon('cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBooking}
                        disabled={createLoading || !newBookingData.clientName || !newBookingData.clientEmail || !newBookingData.serviceId || !newBookingData.providerId || !newBookingData.date || !newBookingData.time}
                    >
                        {createLoading ? <CircularProgress size={24} /> : t('newBooking')}
                    </Button>
                </DialogActions>
            </Dialog >
        </>
    );
}
