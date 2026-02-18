'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */


import * as React from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LIST_PROVIDERS, GET_PROVIDER_AVAILABILITY, SET_PROVIDER_AVAILABILITY, SET_PROVIDER_EXCEPTIONS } from '../../graphql/queries';
import {
    Typography,
    Box,
    Card,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Switch,
    Button,
    IconButton,
    Paper,
    Stack,
    Chip,
    Alert,
    FormControlLabel,
    Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format } from 'date-fns';
import { es, enUS, ptBR } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useToast } from '../../components/common/ToastContext';

// --- Types ---
interface TimeWindow {
    start: string;
    end: string;
}

interface DaySchedule {
    dayOfWeek: number; // 1=Mon, 7=Sun
    dayName: string; // Keep for internal reference, but display via i18n
    enabled: boolean;
    timeWindows: TimeWindow[];
}

interface Exception {
    id: string;
    date: string; // YYYY-MM-DD
    note: string;
    type: 'off' | 'custom';
    timeWindows?: TimeWindow[]; // New field for partial exceptions
}

interface Provider {
    providerId: string;
    name: string;
}

const client = generateClient();

// Initial structure, names will be overridden by i18n in UI
const DEFAULT_SCHEDULE: DaySchedule[] = [
    { dayOfWeek: 1, dayName: 'Monday', enabled: false, timeWindows: [] },
    { dayOfWeek: 2, dayName: 'Tuesday', enabled: false, timeWindows: [] },
    { dayOfWeek: 3, dayName: 'Wednesday', enabled: false, timeWindows: [] },
    { dayOfWeek: 4, dayName: 'Thursday', enabled: false, timeWindows: [] },
    { dayOfWeek: 5, dayName: 'Friday', enabled: false, timeWindows: [] },
    { dayOfWeek: 6, dayName: 'Saturday', enabled: false, timeWindows: [] },
    { dayOfWeek: 7, dayName: 'Sunday', enabled: false, timeWindows: [] },
];

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function AvailabilityPage() {
    const t = useTranslations('availability');
    const tCommon = useTranslations('common');
    const locale = useLocale(); // Get current locale (es, en, pt)
    const { showToast } = useToast();

    // Map locale to date-fns locale
    const dateLocaleMap: Record<string, Locale> = {
        'es': es,
        'en': enUS,
        'pt': ptBR
    };
    const dateLocale = dateLocaleMap[locale] || enUS; // Default to English if locale not found

    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = React.useState('');
    const [isSaved, setIsSaved] = React.useState(true);
    const [loading, setLoading] = React.useState(false);

    // Ideally, this would be fetched based on selectedProvider
    const [schedule, setSchedule] = React.useState<DaySchedule[]>(DEFAULT_SCHEDULE);
    const [exceptions, setExceptions] = React.useState<Exception[]>([]);
    const [newExceptionDate, setNewExceptionDate] = React.useState('');
    const [newExceptionType, setNewExceptionType] = React.useState<'off' | 'custom'>('off');
    const [newExceptionWindows, setNewExceptionWindows] = React.useState<TimeWindow[]>([]);

    React.useEffect(() => {
        fetchProviders();
    }, []);



    const fetchProviders = async () => {
        setLoading(true);
        console.log('[AvailabilityPage] Fetching providers...');
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_PROVIDERS });
            console.log('[AvailabilityPage] List providers response:', response);
            const fetchedProviders = response.data?.listProviders || [];

            setProviders(fetchedProviders);
            if (fetchedProviders.length > 0) {
                console.log('[AvailabilityPage] Providers found:', fetchedProviders.length);
                setSelectedProvider(fetchedProviders[0].providerId);
            } else {
                console.log('[AvailabilityPage] No providers found');
            }
        } catch (error: any) {
            console.error('[AvailabilityPage] Error fetching providers:', error);
            setProviders([]);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapBackendToSchedule = React.useCallback((data: any[]) => {

        const dayMap: { [key: string]: number } = {
            'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6, 'SUN': 7
        };
        const newSchedule = DEFAULT_SCHEDULE.map(d => ({ ...d, enabled: false, timeWindows: [] }));

        const exceptionsMap = new Map<string, Exception>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((item: any) => {
            const dayIndex = dayMap[item.dayOfWeek] - 1; // 0-indexed for array
            if (dayIndex >= 0) {
                newSchedule[dayIndex] = {
                    ...newSchedule[dayIndex],
                    enabled: item.timeRanges.length > 0,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    timeWindows: item.timeRanges.map((tr: any) => ({
                        start: tr.startTime,
                        end: tr.endTime
                    }))
                };
            }
            if (item.exceptions && Array.isArray(item.exceptions)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                item.exceptions.forEach((ex: any) => {
                    let dateStr = '';
                    let timeWindows: TimeWindow[] = [];
                    let type: 'off' | 'custom' = 'off';

                    if (typeof ex === 'string') {
                        dateStr = ex;
                    } else if (ex && ex.date) {
                        dateStr = ex.date;
                        if (ex.timeRanges && Array.isArray(ex.timeRanges) && ex.timeRanges.length > 0) {
                            type = 'custom';
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            timeWindows = ex.timeRanges.map((tr: any) => ({
                                start: tr.startTime,
                                end: tr.endTime
                            }));
                        }
                    }

                    if (dateStr && !exceptionsMap.has(dateStr)) {
                        exceptionsMap.set(dateStr, {
                            id: Math.random().toString(),
                            date: dateStr,
                            note: type === 'off' ? 'Day Off' : 'Custom Hours',
                            type: type,
                            timeWindows: timeWindows
                        });
                    }
                });
            }
        });
        setSchedule(newSchedule);
        setExceptions(Array.from(exceptionsMap.values()));
    }, []);

    const fetchAvailability = React.useCallback(async (providerId: string) => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_PROVIDER_AVAILABILITY,
                variables: { providerId }
            });
            const availabilityData = response.data.getProviderAvailability;
            mapBackendToSchedule(availabilityData);
        } catch (error: any) {
            console.error('Error fetching availability:', error);
            // On error or empty, reset to default (all disabled)
            setSchedule(DEFAULT_SCHEDULE.map(d => ({ ...d, enabled: false, timeWindows: [] })));
        } finally {
            setLoading(false);
        }
    }, [mapBackendToSchedule]);

    React.useEffect(() => {
        if (selectedProvider) {
            fetchAvailability(selectedProvider);
        }
    }, [selectedProvider, fetchAvailability]);

    const handleDayToggle = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule[index].enabled = !newSchedule[index].enabled;
        if (newSchedule[index].enabled && newSchedule[index].timeWindows.length === 0) {
            newSchedule[index].timeWindows.push({ start: '09:00', end: '17:00' });
        }
        setSchedule(newSchedule);
        setIsSaved(false);
    };

    const handleTimeChange = (dayIndex: number, windowIndex: number, field: 'start' | 'end', value: string) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows[windowIndex][field] = value;
        setSchedule(newSchedule);
        setIsSaved(false);
    };

    const addTimeWindow = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows.push({ start: '18:00', end: '20:00' });
        setSchedule(newSchedule);
        setIsSaved(false);
    };

    const removeTimeWindow = (dayIndex: number, windowIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows.splice(windowIndex, 1);
        setSchedule(newSchedule);
        setIsSaved(false);
    };

    const handleAddException = () => {
        if (!newExceptionDate) return;

        // Validate: don't allow past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(newExceptionDate + 'T00:00:00');

        if (selectedDate < today) {
            showToast(t('alertPastDate'), 'error');
            return;
        }

        // Check for duplicates
        if (exceptions.some(ex => ex.date === newExceptionDate)) {
            showToast(t('alertDuplicateDate'), 'warning');
            return;
        }

        const newEx: Exception = {
            id: Math.random().toString(),
            date: newExceptionDate,
            note: newExceptionType === 'off' ? t('dayOff') : 'Custom Hours',
            type: newExceptionType,
            timeWindows: newExceptionType === 'custom' ? newExceptionWindows : []
        };

        setExceptions(prev => [...prev, newEx]);

        // Reset form
        setNewExceptionDate('');
        setNewExceptionType('off');
        setNewExceptionWindows([]);
        setIsSaved(false);
    };

    const toggleNewExceptionType = () => {
        setNewExceptionType(prev => prev === 'off' ? 'custom' : 'off');
        // Default to standard hours if switching to custom
        if (newExceptionType === 'off') {
            setNewExceptionWindows([{ start: '09:00', end: '13:00' }]);
        }
    };

    // Handlers for exception time windows
    const addExceptionWindow = () => {
        setNewExceptionWindows(prev => [...prev, { start: '14:00', end: '18:00' }]);
    };

    const removeExceptionWindow = (index: number) => {
        setNewExceptionWindows(prev => prev.filter((_, i) => i !== index));
    };

    const updateExceptionWindow = (index: number, field: 'start' | 'end', value: string) => {
        const updated = [...newExceptionWindows];
        updated[index][field] = value;
        setNewExceptionWindows(updated);
    };

    const handleDeleteException = (id: string) => {
        setExceptions(prev => prev.filter(e => e.id !== id));
        setIsSaved(false);
    };

    const handleSave = async () => {
        if (!selectedProvider) return;
        setLoading(true);
        try {
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const dayMapReverse = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

            // 1. Save weekly schedule (availability per day)
            const schedulePromises = schedule.map((day, index) => {
                const dayStr = dayMapReverse[index];
                const timeRanges = day.enabled ? day.timeWindows.map(tw => ({
                    startTime: tw.start,
                    endTime: tw.end
                })) : [];

                return client.graphql({
                    query: SET_PROVIDER_AVAILABILITY,
                    variables: {
                        input: {
                            providerId: selectedProvider,
                            dayOfWeek: dayStr,
                            timeRanges: timeRanges,
                            breaks: []
                        }
                    },
                    authToken: token
                });
            });

            // 2. Save exceptions separately (provider-level)
            const formattedExceptions = exceptions.map(ex => ({
                date: ex.date,
                timeRanges: ex.timeWindows?.map(tw => ({
                    startTime: tw.start,
                    endTime: tw.end
                })) || [] // Empty means full day off
            }));

            const exceptionsPromise = client.graphql({
                query: SET_PROVIDER_EXCEPTIONS,
                variables: {
                    input: {
                        providerId: selectedProvider,
                        exceptions: formattedExceptions
                    }
                },
                authToken: token
            });

            // Execute all in parallel
            await Promise.all([...schedulePromises, exceptionsPromise]);

            setIsSaved(true);
            showToast(t('alertSaveSuccess'), 'success');
        } catch (error: any) {
            console.error('Error saving availability:', error);
            showToast(t('alertSaveError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDayLabel = (index: number) => {
        return t(`days.${dayKeys[index]}`);
    };

    // Helper to convert HH:mm string to Date for TimePicker
    const parseTime = (timeStr: string) => {
        if (!timeStr) return null;
        const d = new Date();
        const [hours, minutes] = timeStr.split(':');
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        return d;
    };

    // Helper to convert Date from TimePicker to HH:mm string
    const formatTime = (date: Date | null) => {
        return date ? format(date, 'HH:mm') : '';
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">{t('title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaved}
                >
                    {isSaved ? t('saved') : t('saveChanges')}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Top: Provider Selector */}
                <Grid item xs={12}>
                    <Card sx={{ p: 3 }}>
                        <FormControl fullWidth disabled={loading && providers.length === 0}>
                            <InputLabel>{t('selectProvider')}</InputLabel>
                            <Select
                                value={selectedProvider || ''}
                                label={t('selectProvider')}
                                onChange={(e) => setSelectedProvider(e.target.value)}
                            >
                                {providers.map((p) => (
                                    <MenuItem key={p.providerId} value={p.providerId}>{p.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Card>
                </Grid>

                {/* Left: Weekly Schedule */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon color="primary" /> {t('weeklySchedule')}
                        </Typography>

                        <Stack spacing={2}>
                            {loading ? (
                                // Skeleton Loader
                                Array.from(new Array(7)).map((_, index) => (
                                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Skeleton variant="rounded" width={40} height={24} />
                                                <Skeleton variant="text" width={100} height={24} />
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))
                            ) : (
                                schedule.map((day, dayIndex) => (
                                    <Paper key={dayIndex} variant="outlined" sx={{ p: 2, bgcolor: day.enabled ? 'background.paper' : 'action.hover' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: day.enabled ? 2 : 0 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={day.enabled}
                                                        onChange={() => handleDayToggle(dayIndex)}
                                                    />
                                                }
                                                label={<Typography variant="subtitle1" fontWeight="bold">{getDayLabel(dayIndex)}</Typography>}
                                            />
                                            {day.enabled && (
                                                <Button size="small" startIcon={<AddIcon />} onClick={() => addTimeWindow(dayIndex)}>
                                                    {t('addSlot')}
                                                </Button>
                                            )}
                                        </Box>

                                        {day.enabled && (
                                            <Stack spacing={1}>
                                                {day.timeWindows.map((window, windowIndex) => (
                                                    <Box key={windowIndex} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
                                                            <TimePicker
                                                                label="Inicio"
                                                                value={parseTime(window.start)}
                                                                onChange={(newValue) => handleTimeChange(dayIndex, windowIndex, 'start', formatTime(newValue))}
                                                                slotProps={{ textField: { size: 'small', sx: { width: 120 } } }}
                                                                ampm={false}
                                                            />
                                                            <Typography>-</Typography>
                                                            <TimePicker
                                                                label="Fin"
                                                                value={parseTime(window.end)}
                                                                onChange={(newValue) => handleTimeChange(dayIndex, windowIndex, 'end', formatTime(newValue))}
                                                                slotProps={{ textField: { size: 'small', sx: { width: 120 } } }}
                                                                ampm={false}
                                                            />
                                                        </LocalizationProvider>
                                                        {day.timeWindows.length > 1 && (
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => removeTimeWindow(dayIndex, windowIndex)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Paper>
                                ))
                            )}
                        </Stack>
                    </Card>
                </Grid>

                {/* Right: Exceptions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventBusyIcon color="error" /> {t('exceptions')}
                        </Typography>

                        <Stack spacing={2} sx={{ mb: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
                                <DatePicker
                                    label={t('addExceptionDate')}
                                    value={newExceptionDate ? new Date(newExceptionDate + 'T00:00:00') : null}
                                    onChange={(newValue) => {
                                        if (newValue) {
                                            setNewExceptionDate(format(newValue, 'yyyy-MM-dd'));
                                        } else {
                                            setNewExceptionDate('');
                                        }
                                    }}
                                    disablePast
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </LocalizationProvider>

                            <FormControlLabel
                                control={<Switch checked={newExceptionType === 'custom'} onChange={toggleNewExceptionType} />}
                                label="Habilitar Horario Parcial"
                            />

                            {newExceptionType === 'custom' && (
                                <Box sx={{ pl: 2, borderLeft: '2px solid #ddd' }}>
                                    <Typography variant="caption" display="block" mb={1}>Franjas Horarias Disponibles:</Typography>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
                                        {newExceptionWindows.map((window, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <TimePicker
                                                    value={parseTime(window.start)}
                                                    onChange={(newValue) => updateExceptionWindow(idx, 'start', formatTime(newValue))}
                                                    slotProps={{ textField: { size: 'small', sx: { width: 110 } } }}
                                                    ampm={false}
                                                />
                                                <Typography>-</Typography>
                                                <TimePicker
                                                    value={parseTime(window.end)}
                                                    onChange={(newValue) => updateExceptionWindow(idx, 'end', formatTime(newValue))}
                                                    slotProps={{ textField: { size: 'small', sx: { width: 110 } } }}
                                                    ampm={false}
                                                />
                                                <IconButton size="small" color="error" onClick={() => removeExceptionWindow(idx)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </LocalizationProvider>
                                    <Button size="small" startIcon={<AddIcon />} onClick={addExceptionWindow}>
                                        Agregar Rango
                                    </Button>
                                </Box>
                            )}

                            <Button variant="contained" size="small" onClick={handleAddException} disabled={!newExceptionDate}>
                                {tCommon('add')}
                            </Button>
                        </Stack>

                        {!isSaved && (
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                {t('unsavedChangesWarning')}
                            </Alert>
                        )}

                        <Stack spacing={2}>
                            {exceptions.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center">
                                    {t('noExceptions')}
                                </Typography>
                            )}
                            {exceptions.map((ex) => (
                                <Paper key={ex.id} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <Box>
                                            <Typography variant="subtitle2">{ex.date}</Typography>
                                            {ex.type === 'off' ? (
                                                <Chip label={t('dayOff')} size="small" color="error" variant="outlined" sx={{ mt: 0.5 }} />
                                            ) : (
                                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                                    {ex.timeWindows?.map((tw, i) => (
                                                        <Chip key={i} label={`${tw.start}-${tw.end}`} size="small" color="success" variant="outlined" />
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                        <IconButton size="small" onClick={() => handleDeleteException(ex.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Paper>
                            ))}
                        </Stack>
                    </Card>

                    <Alert severity="info" sx={{ mt: 3 }}>
                        {t('configuringFor')} <strong>{providers.find(p => p.providerId === selectedProvider)?.name}</strong>.
                        {t('visibilityWarning')}
                    </Alert>
                </Grid>
            </Grid>
        </Box>
    );
}
