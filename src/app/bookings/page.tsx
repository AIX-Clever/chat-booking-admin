
'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Badge } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
// Removed unused date-fns imports
import { LIST_PROVIDERS, LIST_BOOKINGS_BY_PROVIDER, CANCEL_BOOKING, SEARCH_SERVICES, CREATE_BOOKING, CONFIRM_BOOKING, MARK_AS_NO_SHOW, UPDATE_BOOKING_STATUS, LIST_ROOMS, GET_AVAILABLE_SLOTS, GET_PROVIDER_AVAILABILITY } from '../../graphql/queries';
import { useTenant } from '../../context/TenantContext';

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
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText
    // FormControl // Unused

} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import SearchIcon from '@mui/icons-material/Search';
import EventIcon from '@mui/icons-material/Event';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import TodayIcon from '@mui/icons-material/Today';

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
    roomId?: string;
}

interface Provider {
    providerId: string;
    name: string;
    serviceIds: string[];
}

const STATUS_COLORS: Record<BookingStatus, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    completed: 'info',
    no_show: 'default'
};

// Professional color palette - works in both light and dark modes
const PROVIDER_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#1e40af', darkText: '#93c5fd' }, // Blue
    { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#065f46', darkText: '#6ee7b7' }, // Green
    { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#92400e', darkText: '#fcd34d' }, // Amber
    { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', text: '#5b21b6', darkText: '#c4b5fd' }, // Purple
    { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#9f1239', darkText: '#f9a8d4' }, // Pink
    { bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', text: '#115e59', darkText: '#5eead4' }, // Teal
    { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#9a3412', darkText: '#fdba74' }, // Orange
    { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#3730a3', darkText: '#a5b4fc' }, // Indigo
];

const getProviderColor = (providerId: string) => {
    const hash = providerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PROVIDER_COLORS[hash % PROVIDER_COLORS.length];
};

const STATUSES = ['All', 'confirmed', 'pending', 'cancelled', 'completed', 'no_show'];

// NOTE: generateClient() moved inside the component to avoid SSR initialization issues

export default function BookingsPage() {
    const t = useTranslations('bookings');
    const tCommon = useTranslations('common');

    // Generate client inside component to ensure Amplify is configured
    const client = React.useMemo(() => generateClient(), []);
    const locale = useLocale();

    const [bookings, setBookings] = React.useState<Booking[]>([]);
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filterProvider, setFilterProvider] = React.useState('all');
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [filterRoom, setFilterRoom] = React.useState('all');
    const [rooms, setRooms] = React.useState<{ roomId: string, name: string }[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [hasMounted, setHasMounted] = React.useState(false);
    const [sortBy, setSortBy] = React.useState<'closest' | 'furthest'>('closest');
    const { loading: tenantLoading, tenant } = useTenant(); // Wait for tenant context to be ready

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
        // Only fetch when tenant context is FULLY loaded (auth is ready AND tenant is populated)
        if (!tenantLoading && tenant) {
            // Small delay to ensure Amplify session is fully restored
            const timer = setTimeout(() => {
                console.log('DEBUG: Tenant ready, triggering initial fetches');
                fetchServices();
                fetchProviders();
                fetchRooms();
            }, 500);
            return () => clearTimeout(timer);
        } else if (!tenantLoading && !tenant) {
            // No tenant means not authenticated or tenant not found, stop loading
            console.log('DEBUG: No tenant found, stopping loading');
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tenantLoading, tenant?.tenantId]); // Use tenantId to be more specific

    const fetchProviders = async (retryCount = 0): Promise<void> => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 500; // ms

        // Check if user is authenticated before making the request
        try {
            const { getCurrentUser } = await import('aws-amplify/auth');
            await getCurrentUser();
        } catch {
            console.log('User not authenticated, skipping providers fetch');
            setLoading(false);
            return;
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: LIST_PROVIDERS,
                authMode: 'userPool'
            });
            const fetchedProviders = response.data.listProviders;
            setProviders(fetchedProviders);
            // Fetch bookings for all providers, or set loading false if empty
            if (fetchedProviders && fetchedProviders.length > 0) {
                // Removed explicit fetchBookings call as it's handled by the useEffect on [providers]
            } else {
                console.log('No providers found, setting loading to false');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error fetching providers (attempt ' + (retryCount + 1) + '):', error);
            // Retry with delay if we haven't exceeded max retries
            if (retryCount < MAX_RETRIES) {
                console.log('Retrying in ' + RETRY_DELAY + 'ms...');
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return fetchProviders(retryCount + 1);
            }
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_ROOMS });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fetchedRooms = response.data.listRooms.map((r: any) => ({
                roomId: r.roomId,
                name: r.name
            }));
            setRooms(fetchedRooms);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const fetchBookings = async (currentProviders: Provider[]) => {
        if (currentProviders.length === 0) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const today = new Date();
            const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(); // Last month
            const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString(); // Next 2 months

            // If filterProvider is 'all', fetch for all. Else fetch for specific.
            const providersToFetch = filterProvider === 'all'
                ? currentProviders
                : currentProviders.filter(p => p.providerId === filterProvider);

            // Parallelize using Promise.all
            const bookingPromises = providersToFetch.map(async (provider) => {
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
                    },
                    authMode: 'userPool'
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return response.data.listBookingsByProvider.map((b: any) => ({
                    id: b.bookingId,
                    clientName: b.clientName,
                    clientEmail: b.clientEmail,
                    clientPhone: b.clientPhone,
                    serviceName: b.serviceId, // Storing ID here, resolved in render
                    providerName: provider.name,
                    start: b.start,
                    status: b.status.toLowerCase() as BookingStatus,
                    notes: b.notes,
                    providerId: provider.providerId,
                    roomId: b.roomId
                }));
            });

            const results = await Promise.all(bookingPromises);
            const allBookings = results.flat();

            // Debug logging for Room ID
            console.log('--- BOOKING ROOM DEBUG ---');
            allBookings.forEach(b => {
                console.log(`Booking ${b.id} | Client: ${b.clientName} | Room: ${b.roomId}`);
            });
            console.log('--------------------------');

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
    const [availableSlots, setAvailableSlots] = React.useState<{ start: string, end: string, isAvailable: boolean }[]>([]);
    const [slotsLoading, setSlotsLoading] = React.useState(false);


    const fetchServices = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: SEARCH_SERVICES,
                variables: {
                    text: '',
                    availableOnly: true
                },
                authMode: 'userPool'
            }); // Fetch available only
            setAvailableServices(response.data.searchServices);
        } catch (error) {
            console.error('Error fetching services:', error);
            // Don't set loading false here as fetchProviders/fetchBookings handles the main page loader
        }
    };

    const fetchAvailableSlots = async () => {
        // Only fetch if we have all requirements
        if (!newBookingData.providerId || !newBookingData.serviceId || !newBookingData.date) {
            setAvailableSlots([]);
            return;
        }

        setSlotsLoading(true);
        try {
            const startOfDay = new Date(`${newBookingData.date}T00:00:00`).toISOString();
            const endOfDay = new Date(`${newBookingData.date}T23:59:59`).toISOString();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_AVAILABLE_SLOTS,
                variables: {
                    input: {
                        serviceId: newBookingData.serviceId,
                        providerId: newBookingData.providerId,
                        from: startOfDay,
                        to: endOfDay
                    }
                }
            });

            // Filter for true availability
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const slots = response.data.getAvailableSlots.filter((s: any) => s.isAvailable);
            setAvailableSlots(slots);
        } catch (error) {
            console.error('Error fetching slots:', error);
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    // Trigger fetch when dependencies change
    React.useEffect(() => {
        if (newBookingOpen) {
            fetchAvailableSlots();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newBookingData.date, newBookingData.providerId, newBookingData.serviceId, newBookingOpen]);

    const [workingDays, setWorkingDays] = React.useState<number[]>([]);

    const fetchProviderSchedule = React.useCallback(async (providerId: string) => {
        if (!providerId) return;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_PROVIDER_AVAILABILITY,
                variables: { providerId }
            });
            const availability = response.data.getProviderAvailability;
            const daysMap: Record<string, number> = {
                'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6,
                'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const activeDays = availability.map((a: any) => daysMap[a.dayOfWeek.toLowerCase()]).filter((d: any) => d !== undefined);
            setWorkingDays(activeDays);
        } catch (error) {
            console.error('Error fetching provider schedule:', error);
        }
    }, [client]);

    React.useEffect(() => {
        if (newBookingData.providerId) {
            fetchProviderSchedule(newBookingData.providerId);
        } else {
            setWorkingDays([]);
        }
    }, [newBookingData.providerId, fetchProviderSchedule]);


    const CustomDay = (props: PickersDayProps<Date>) => {
        const { day, outsideCurrentMonth, ...other } = props;
        const dayOfWeek = day.getDay();
        const isWorkingDay = workingDays.includes(dayOfWeek);

        // Highlight working days, dim others but keep clickable
        return (
            <Badge
                key={props.day.toString()}
                overlap="circular"
                badgeContent={isWorkingDay ? '•' : undefined}
                color="primary"
                invisible={!isWorkingDay}
                sx={{
                    '& .MuiBadge-badge': {
                        top: 5,
                        right: 5,
                        minWidth: '8px',
                        height: '8px',
                        p: 0
                    }
                }}
            >
                <PickersDay
                    {...other}
                    outsideCurrentMonth={outsideCurrentMonth}
                    day={day}
                    sx={{
                        opacity: isWorkingDay ? 1 : 0.4,
                        fontWeight: isWorkingDay ? 'bold' : 'normal',
                    }}
                />
            </Badge>
        );
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

    const handleCreateBooking = async (forceOverbook: boolean | React.MouseEvent = false) => {
        const isForced = typeof forceOverbook === 'boolean' ? forceOverbook : false;

        setCreateLoading(true);
        try {
            const startDateTime = new Date(`${newBookingData.date}T${newBookingData.time}`);
            const service = availableServices.find(s => s.serviceId === newBookingData.serviceId);
            const duration = service ? service.durationMinutes : 60; // Default or fetched
            const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

            // Overbook validation
            if (!isForced) {
                const isSlotAvailable = availableSlots.some(
                    s => new Date(s.start).getTime() === startDateTime.getTime() && s.isAvailable
                );

                if (!isSlotAvailable) {
                    setCreateLoading(false);
                    setOverbookConfirmOpen(true);
                    return;
                }
            }

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
                        notes: newBookingData.notes || null,
                        ignoreAvailability: isForced
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

    // Confirm Overbook Dialog State
    const [overbookConfirmOpen, setOverbookConfirmOpen] = React.useState(false);

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
    const [viewMode, setViewMode] = React.useState<ViewMode>('week'); // Default to week view
    const [currentDate, setCurrentDate] = React.useState(new Date());

    // Context menu for quick status update
    const [statusMenuAnchor, setStatusMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [statusMenuBooking, setStatusMenuBooking] = React.useState<Booking | null>(null);

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

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleSlotClick = (date: Date, time?: string) => {
        const selectedDateTime = new Date(date);

        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            selectedDateTime.setHours(hours, minutes, 0, 0);
        } else {
            selectedDateTime.setHours(9, 0, 0, 0);
        }

        setNewBookingData({
            clientName: '',
            clientEmail: '',
            clientPhone: '',
            serviceId: '',
            providerId: '',
            date: selectedDateTime.toISOString().split('T')[0],
            time: `${String(selectedDateTime.getHours()).padStart(2, '0')}:${String(selectedDateTime.getMinutes()).padStart(2, '0')}`,
            notes: ''
        });
        setNewBookingOpen(true);
    };

    const handleContextMenu = (event: React.MouseEvent, booking: Booking) => {
        event.preventDefault();
        setStatusMenuAnchor(event.currentTarget as HTMLElement);
        setStatusMenuBooking(booking);
    };

    const handleQuickStatusChange = async (newStatus: string) => {
        if (!statusMenuBooking) return;

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: UPDATE_BOOKING_STATUS,
                variables: {
                    bookingId: statusMenuBooking.id,
                    status: newStatus.toUpperCase()
                },
                authToken: token
            });

            // Update local state
            setBookings(prev => prev.map(b =>
                b.id === statusMenuBooking.id
                    ? { ...b, status: newStatus as BookingStatus }
                    : b
            ));

            // Update selected booking if in detail dialog
            if (selectedBooking?.id === statusMenuBooking.id) {
                setSelectedBooking(prev => prev ? { ...prev, status: newStatus as BookingStatus } : null);
            }

            setStatusMenuAnchor(null);
            setStatusMenuBooking(null);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<Grid item xs={1.7} key={`empty-${i}`} sx={{ height: 120, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }} />);
        }

        // Days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayBookings = statusFilteredBookings.filter(b => b.start.startsWith(dateStr));

            const dayDate = new Date(`${dateStr}T00:00:00`);

            days.push(
                <Grid
                    item
                    xs={1.7}
                    key={day}
                    sx={{ height: 120, border: 1, borderColor: 'divider', p: 1, overflow: 'hidden', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    onClick={(e) => {
                        // Only trigger if clicking empty space, not a booking chip
                        if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.MuiTypography-root')) {
                            handleSlotClick(dayDate);
                        }
                    }}
                >
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{day}</Typography>
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {dayBookings.map(b => {
                            const providerColor = getProviderColor(b.providerId || '');
                            return (
                                <Chip
                                    key={b.id}
                                    label={`${new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${b.clientName}`}
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleViewDetail(b); }}
                                    onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, b); }}
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        justifyContent: 'flex-start',
                                        textTransform: 'capitalize',
                                        borderRadius: 0,
                                        bgcolor: providerColor.bg,
                                        borderLeft: `3px solid ${providerColor.border}`,
                                        color: (theme) => theme.palette.mode === 'dark' ? providerColor.darkText : providerColor.text,
                                        width: '100%',
                                        '& .MuiChip-label': { px: 1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }
                                    }}
                                />
                            );
                        })}
                    </Stack>
                </Grid>
            );
        }

        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button onClick={handlePrev} startIcon={<ArrowBackIosNewIcon />}>{t('actions.prev')}</Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button onClick={handleToday} startIcon={<TodayIcon />} variant="outlined" size="small">
                            {t('today')}
                        </Button>
                        <Typography variant="h6">
                            {currentDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>
                    <Button onClick={handleNext} endIcon={<ArrowForwardIosIcon />}>{t('actions.next')}</Button>
                </Box>
                {/* Weekday Headers */}
                <Grid container>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <Grid item xs={1.7} key={d} sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2">{t(`availability.days.${d.toLowerCase()}`).substring(0, 3)}</Typography>
                        </Grid>
                    ))}
                    {days}
                </Grid>
            </Box>
        );
    };

    const renderWeekCalendar = () => {
        // Constants for the grid
        const START_HOUR = 8;
        const END_HOUR = 20; // 8 PM
        const HOUR_HEIGHT = 60; // 1px = 1min
        const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

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

        // Helper to position events
        const getEventStyle = (booking: Booking) => {
            const startDate = new Date(booking.start);
            const hours = startDate.getHours();
            const minutes = startDate.getMinutes();

            // Calculate minutes from start of validation day (START_HOUR)
            const minutesFromStart = (hours - START_HOUR) * 60 + minutes;

            // Find service duration
            const service = availableServices.find(s => s.serviceId === booking.serviceName); // providerName stored as ID? No, serviceName is ID.
            // Fallback duration if not found
            const duration = service?.durationMinutes || 60;

            return {
                top: Math.max(0, minutesFromStart), // Avoid negative top
                height: duration, // 1px per min
                position: 'absolute' as const,
                width: '95%',
                left: '2.5%',
                zIndex: 2
            };
        };

        return (
            <Box>
                {/* Header Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Button onClick={handlePrev} startIcon={<ArrowBackIosNewIcon />}>{t('actions.prev')}</Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button onClick={handleToday} startIcon={<TodayIcon />} variant="outlined" size="small">
                            {t('today')}
                        </Button>
                        <Typography variant="h6">
                            {t('weekOf', { day: monday.getDate(), month: monday.toLocaleDateString(locale, { month: 'long' }) })}
                        </Typography>
                    </Box>
                    <Button onClick={handleNext} endIcon={<ArrowForwardIosIcon />}>{t('actions.next')}</Button>
                </Box>

                <Paper variant="outlined" sx={{ display: 'flex', position: 'relative', overflowX: 'auto' }}>

                    {/* Time Column (Left Axis) */}
                    <Box sx={{ width: 60, flexShrink: 0, borderRight: 1, borderColor: 'divider' }}>
                        {/* Header Spacer */}
                        <Box sx={{ height: 50, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }} />

                        {/* Time Labels */}
                        <Box sx={{ position: 'relative', height: TOTAL_HEIGHT }}>
                            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                                const hour = START_HOUR + i;
                                return (
                                    <Typography
                                        key={hour}
                                        variant="caption"
                                        sx={{
                                            position: 'absolute',
                                            top: i * HOUR_HEIGHT - 10, // Offset to center on line
                                            width: '100%',
                                            textAlign: 'center',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        {hour}:00
                                    </Typography>
                                );
                            })}
                        </Box>
                    </Box>

                    {/* Days Columns */}
                    <Box sx={{ display: 'flex', flexGrow: 1, minWidth: 800 }}>
                        {weekDays.map((dayDate, index) => {
                            const dateStr = dayDate.toISOString().split('T')[0];
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            // Filter bookings for this day
                            const dayBookings = statusFilteredBookings.filter(b => b.start.startsWith(dateStr));

                            return (
                                <Box key={dateStr} sx={{ flex: 1, borderRight: index < 6 ? 1 : 0, borderColor: 'divider', minWidth: 100 }}>

                                    {/* Day Header */}
                                    <Box sx={{
                                        height: 50,
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        bgcolor: isToday ? 'primary.light' : 'background.default',
                                        color: isToday ? 'primary.contrastText' : 'text.primary',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 10
                                    }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {dayDate.toLocaleDateString(locale, { weekday: 'short' })}
                                        </Typography>
                                        <Typography variant="body2">
                                            {dayDate.getDate()}
                                        </Typography>
                                    </Box>

                                    {/* Grid Content */}
                                    <Box
                                        sx={{ position: 'relative', height: TOTAL_HEIGHT, bgcolor: isToday ? 'action.hover' : 'background.paper', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            // Calculate clicked time based on mouse position
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const y = e.clientY - rect.top;
                                            const minutesFromStart = Math.floor(y);
                                            const totalMinutes = START_HOUR * 60 + minutesFromStart;
                                            const hours = Math.floor(totalMinutes / 60);
                                            const minutes = Math.floor((totalMinutes % 60) / 15) * 15; // Round to nearest 15 min
                                            const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                            handleSlotClick(dayDate, timeStr);
                                        }}
                                    >

                                        {/* Horizontal Grid Lines */}
                                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                            <Box
                                                key={`grid-${i}`}
                                                sx={{
                                                    position: 'absolute',
                                                    top: (i + 1) * HOUR_HEIGHT,
                                                    width: '100%',
                                                    borderBottom: '1px dashed',
                                                    borderColor: 'divider',
                                                    opacity: 0.5
                                                }}
                                            />
                                        ))}

                                        {/* Bookings */}
                                        {dayBookings.map(b => {
                                            const style = getEventStyle(b);
                                            const providerColor = getProviderColor(b.providerId || '');
                                            // Don't render if outside of view range (simplification)
                                            // Actually CSS overflow hidden on container would hide it, but let's be safe?
                                            // For now just render all.

                                            return (
                                                <Tooltip
                                                    key={b.id}
                                                    title={
                                                        <React.Fragment>
                                                            <Typography variant="body2" fontWeight="bold">{b.clientName}</Typography>
                                                            <Typography variant="caption" display="block">{availableServices.find(s => s.serviceId === b.serviceName)?.name || b.serviceName}</Typography>
                                                            <Typography variant="caption" display="block">Prov: {b.providerName}</Typography>
                                                            {b.notes && <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>&quot;{b.notes}&quot;</Typography>}
                                                        </React.Fragment>
                                                    }
                                                    arrow
                                                >
                                                    <Paper
                                                        elevation={3}
                                                        onClick={(e) => { e.stopPropagation(); handleViewDetail(b); }}
                                                        onContextMenu={(e) => handleContextMenu(e, b)}
                                                        sx={{
                                                            ...style,
                                                            p: 0.5,
                                                            borderLeft: `4px solid ${providerColor.border}`,
                                                            bgcolor: providerColor.bg,
                                                            borderRadius: 0,
                                                            cursor: 'pointer',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            '&:hover': { zIndex: 10, boxShadow: 6 }
                                                        }}
                                                    >
                                                        {/* Header: Time & Name */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <Typography variant="caption" fontWeight="bold" sx={{ lineHeight: 1.1, fontSize: '0.7rem', color: (theme) => theme.palette.mode === 'dark' ? providerColor.darkText : providerColor.text }}>
                                                                {b.clientName}
                                                            </Typography>
                                                        </Box>

                                                        {/* Service Name */}
                                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>
                                                            {availableServices.find(s => s.serviceId === b.serviceName)?.name || b.serviceName}
                                                        </Typography>

                                                        {/* Provider (only if enough height) */}
                                                        {style.height >= 45 && (
                                                            <Typography variant="caption" noWrap sx={{ fontSize: '0.6rem', mt: 'auto', color: (theme) => theme.palette.mode === 'dark' ? providerColor.darkText : providerColor.text, fontWeight: 'medium' }}>
                                                                {b.providerName}
                                                            </Typography>
                                                        )}
                                                    </Paper>
                                                </Tooltip>
                                            );
                                        })}

                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>
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
        const matchesSearch = b.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        // Room filter: handle empty roomId (null/undefined) as a valid filter option
        const matchesRoom = filterRoom === 'all' ||
            (filterRoom === 'no_room' ? !b.roomId : b.roomId === filterRoom);
        return matchesSearch && matchesStatus && matchesRoom;
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
        const text = t('whatsappMessage', { name: selectedBooking.clientName, service: selectedBooking.serviceName, provider: selectedBooking.providerName, date, time });
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
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {/* Provider Filter */}
                    <TextField
                        select
                        label={t('filters.provider')}
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        size="small"
                        sx={{ minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PersonIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="all">{t('filters.all')}</MenuItem>
                        {providers.map((p) => {
                            const providerColor = getProviderColor(p.providerId);
                            return (
                                <MenuItem key={p.providerId} value={p.providerId}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                bgcolor: providerColor.border,
                                                borderRadius: '2px',
                                                flexShrink: 0
                                            }}
                                        />
                                        {p.name}
                                    </Box>
                                </MenuItem>
                            );
                        })}
                    </TextField>

                    {/* Status Filter */}
                    <TextField
                        select
                        label={t('filters.statusLabel')}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        size="small"
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="all">{t('filters.all')}</MenuItem>
                        <MenuItem value="confirmed">{t('status.confirmed')}</MenuItem>
                        <MenuItem value="pending">{t('status.pending')}</MenuItem>
                        <MenuItem value="cancelled">{t('status.cancelled')}</MenuItem>
                        <MenuItem value="completed">{t('status.completed')}</MenuItem>
                        <MenuItem value="noShow">{t('status.noShow')}</MenuItem>
                    </TextField>

                    {/* Room Filter */}
                    <TextField
                        select
                        label={t('filters.room')}
                        value={filterRoom}
                        onChange={(e) => setFilterRoom(e.target.value)}
                        size="small"
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EventIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    >
                        <MenuItem value="all">{t('filters.allRooms')}</MenuItem>
                        {rooms.map((r) => (
                            <MenuItem key={r.roomId} value={r.roomId}>
                                {r.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Sort */}
                    <TextField
                        select
                        label={t('sorting.label')}
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'closest' | 'furthest')}
                        size="small"
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="closest">{t('sorting.closest')}</MenuItem>
                        <MenuItem value="furthest">{t('sorting.furthest')}</MenuItem>
                    </TextField>
                </Stack>

                {viewMode === 'list' && (
                    <Box sx={{ mt: 2 }}>
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
                    </Box>
                )}

                {/* Professional Color Legend for calendar/week views */}
                {(viewMode === 'calendar' || viewMode === 'week') && providers.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
                            {t('professionals')}:
                        </Typography>
                        {providers.map((p) => {
                            const color = getProviderColor(p.providerId);
                            return (
                                <Chip
                                    key={p.providerId}
                                    label={p.name}
                                    size="small"
                                    sx={{
                                        bgcolor: color.bg,
                                        borderLeft: `3px solid ${color.border}`,
                                        color: (theme) => theme.palette.mode === 'dark' ? color.darkText : color.text,
                                        fontWeight: 'medium',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            );
                        })}
                    </Box>
                )}
            </Card >

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
                                            <TableCell>
                                                {(() => {
                                                    const providerColor = getProviderColor(row.providerId || '');
                                                    return (
                                                        <Chip
                                                            label={row.providerName}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: providerColor.bg,
                                                                borderLeft: `3px solid ${providerColor.border}`,
                                                                color: (theme) => theme.palette.mode === 'dark' ? providerColor.darkText : providerColor.text,
                                                                fontWeight: 'medium'
                                                            }}
                                                        />
                                                    );
                                                })()}
                                            </TableCell>
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

            {/* Confirm Overbook Dialog */}
            <Dialog open={overbookConfirmOpen} onClose={() => setOverbookConfirmOpen(false)}>
                <DialogTitle>{t('overbookConfirm.title', 'Confirmar Sobrecupo')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {`¿Estás agendando un sobre cupo para el día ${newBookingData.date}, a las ${newBookingData.time} para: '${providers.find(p => p.providerId === newBookingData.providerId)?.name || 'Profesional'}', estás seguro de sobreagendar?`}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOverbookConfirmOpen(false)} color="inherit">
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            setOverbookConfirmOpen(false);
                            handleCreateBooking(true);
                        }}
                        color="error"
                        variant="contained"
                    >
                        {t('overbookConfirm.confirm', 'Forzar Sobrecupo')}
                    </Button>
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
                                onChange={(e) => setNewBookingData({
                                    ...newBookingData,
                                    serviceId: e.target.value,
                                    providerId: '' // Reset provider when service changes
                                })}
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
                                {providers
                                    .filter(p => !newBookingData.serviceId || (p.serviceIds && p.serviceIds.includes(newBookingData.serviceId)))
                                    .map((p) => (
                                        <MenuItem key={p.providerId} value={p.providerId}>{p.name}</MenuItem>
                                    ))}
                            </TextField>
                        </Grid>
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
                                    slots={{ day: CustomDay }}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                    {t('form.time')}
                                </Typography>
                                {slotsLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : availableSlots.length > 0 ? (
                                    <Box sx={{
                                        maxHeight: 250,
                                        overflowY: 'auto',
                                        pr: 1,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        p: 2,
                                        // Force scrollbar visibility
                                        '&::-webkit-scrollbar': {
                                            width: '8px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#f1f1f1',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#ccc',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: '#999',
                                        },
                                    }}>
                                        {/* Morning Segments */}
                                        {(() => {
                                            const morning = availableSlots.filter(s => {
                                                const h = new Date(s.start).getHours();
                                                return h < 12;
                                            });
                                            const afternoon = availableSlots.filter(s => {
                                                const h = new Date(s.start).getHours();
                                                return h >= 12 && h < 18; // 12pm to 5:59pm
                                            });
                                            const evening = availableSlots.filter(s => {
                                                const h = new Date(s.start).getHours();
                                                return h >= 18;
                                            });

                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            const renderSlotButton = (slot: any) => {
                                                const timeStr = new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
                                                const isSelected = newBookingData.time === timeStr;
                                                return (
                                                    <Button
                                                        key={timeStr}
                                                        variant={isSelected ? "contained" : "outlined"}
                                                        size="small"
                                                        onClick={() => setNewBookingData({ ...newBookingData, time: timeStr })}
                                                        sx={{
                                                            minWidth: '70px',
                                                            borderRadius: '8px',
                                                            px: 1,
                                                            py: 0.5,
                                                            fontSize: '13px',
                                                            fontWeight: 500,
                                                            textTransform: 'none',
                                                            borderColor: isSelected ? 'primary.main' : '#e0e0e0',
                                                            bgcolor: isSelected ? 'primary.main' : '#fff',
                                                            color: isSelected ? '#fff' : '#444',
                                                            boxShadow: isSelected ? 2 : '0 1px 2px rgba(0,0,0,0.05)',
                                                            '&:hover': {
                                                                bgcolor: isSelected ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                                                                borderColor: isSelected ? 'primary.dark' : 'primary.main',
                                                            }
                                                        }}
                                                    >
                                                        {timeStr}
                                                    </Button>
                                                );
                                            };

                                            return (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    {morning.length > 0 && (
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                                                                <WbSunnyIcon sx={{ fontSize: 16, color: '#fbc02d' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Mañana</Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {morning.map(renderSlotButton)}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {afternoon.length > 0 && (
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                                                                <WbTwilightIcon sx={{ fontSize: 16, color: '#ff9800' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Tarde</Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {afternoon.map(renderSlotButton)}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                    {evening.length > 0 && (
                                                        <Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
                                                                <NightsStayIcon sx={{ fontSize: 16, color: '#3f51b5' }} />
                                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Noche</Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {evening.map(renderSlotButton)}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        })()}
                                    </Box>
                                ) : (
                                    <Box sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            {(!newBookingData.date || !newBookingData.providerId)
                                                ? t('availability.selectDateAndProvider')
                                                : t('availability.noSlotsFound')
                                            }
                                        </Typography>
                                    </Box>
                                )}
                                {/* Manual Override */}
                                <Box sx={{ mt: 2 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <TimePicker
                                            label={t('form.manualTime')}
                                            value={newBookingData.time ? new Date(`2000-01-01T${newBookingData.time}:00`) : null}
                                            onChange={(newValue) => {
                                                if (newValue) {
                                                    const hours = String(newValue.getHours()).padStart(2, '0');
                                                    const minutes = String(newValue.getMinutes()).padStart(2, '0');
                                                    setNewBookingData({ ...newBookingData, time: `${hours}:${minutes}` });
                                                }
                                            }}
                                            slotProps={{
                                                textField: { fullWidth: true, size: 'small', helperText: t('availability.manualOverrideHelper') }
                                            }}
                                        />
                                    </LocalizationProvider>
                                </Box>
                            </Box>
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
                        onClick={() => handleCreateBooking(false)}
                        disabled={createLoading || !newBookingData.clientName || !newBookingData.clientEmail || !newBookingData.serviceId || !newBookingData.providerId || !newBookingData.date || !newBookingData.time}
                    >
                        {createLoading ? <CircularProgress size={24} /> : t('newBooking')}
                    </Button>
                </DialogActions>
            </Dialog >

            {/* Quick Status Update Context Menu */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={() => { setStatusMenuAnchor(null); setStatusMenuBooking(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => handleQuickStatusChange('confirmed')}>
                    <ListItemIcon>
                        <CheckCircleIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText>{t('status.confirmed')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleQuickStatusChange('pending')}>
                    <ListItemIcon>
                        <AccessTimeIcon fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText>{t('status.pending')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleQuickStatusChange('cancelled')}>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText>{t('status.cancelled')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleQuickStatusChange('completed')}>
                    <ListItemIcon>
                        <CheckCircleIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText>{t('status.completed')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleQuickStatusChange('no_show')}>
                    <ListItemIcon>
                        <PersonOffIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t('status.noShow')}</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
