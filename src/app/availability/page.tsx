'use client';

import * as React from 'react';
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
    TextField,
    Button,
    IconButton,
    Paper,
    Divider,
    Stack,
    Chip,
    Alert,
    FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';

// --- Types ---
interface TimeWindow {
    start: string;
    end: string;
}

interface DaySchedule {
    dayOfWeek: number; // 1=Mon, 7=Sun
    dayName: string;
    enabled: boolean;
    timeWindows: TimeWindow[];
}

interface Exception {
    id: string;
    date: string; // YYYY-MM-DD
    note: string;
    type: 'off' | 'custom';
}

interface ProviderAvailability {
    providerId: string;
    weeklySchedule: DaySchedule[];
    exceptions: Exception[];
}

// --- Mock Data ---
const PROVIDERS = [
    { id: '1', name: 'Dr. Mario Alvarez' },
    { id: '2', name: 'Ana García' },
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
    { dayOfWeek: 1, dayName: 'Monday', enabled: true, timeWindows: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 2, dayName: 'Tuesday', enabled: true, timeWindows: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 3, dayName: 'Wednesday', enabled: true, timeWindows: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 4, dayName: 'Thursday', enabled: true, timeWindows: [{ start: '09:00', end: '17:00' }] },
    { dayOfWeek: 5, dayName: 'Friday', enabled: true, timeWindows: [{ start: '09:00', end: '14:00' }] },
    { dayOfWeek: 6, dayName: 'Saturday', enabled: false, timeWindows: [] },
    { dayOfWeek: 7, dayName: 'Sunday', enabled: false, timeWindows: [] },
];

export default function AvailabilityPage() {
    const [selectedProvider, setSelectedProvider] = React.useState(PROVIDERS[0].id);
    const [isSaved, setIsSaved] = React.useState(false);

    // Ideally, this would be fetched based on selectedProvider
    const [schedule, setSchedule] = React.useState<DaySchedule[]>(DEFAULT_SCHEDULE);
    const [exceptions, setExceptions] = React.useState<Exception[]>([
        { id: '1', date: '2025-12-25', note: 'Christmas', type: 'off' }
    ]);
    const [newExceptionDate, setNewExceptionDate] = React.useState('');

    // Simulate fetching data when provider changes
    React.useEffect(() => {
        // Reset to default or fetch real data
        console.log(`Fetching availability for ${selectedProvider}`);
        setIsSaved(false);
    }, [selectedProvider]);

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
        setExceptions(prev => [
            ...prev,
            { id: Math.random().toString(), date: newExceptionDate, note: 'Day Off', type: 'off' }
        ]);
        setNewExceptionDate('');
        setIsSaved(false);
    };

    const handleDeleteException = (id: string) => {
        setExceptions(prev => prev.filter(e => e.id !== id));
        setIsSaved(false);
    };

    const handleSave = () => {
        // Here we would call the API
        setTimeout(() => setIsSaved(true), 500);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">Availability</Typography>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={isSaved}
                >
                    {isSaved ? 'Saved' : 'Save Changes'}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Top: Provider Selector */}
                <Grid item xs={12}>
                    <Card sx={{ p: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Select Provider</InputLabel>
                            <Select
                                value={selectedProvider}
                                label="Select Provider"
                                onChange={(e) => setSelectedProvider(e.target.value)}
                            >
                                {PROVIDERS.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Card>
                </Grid>

                {/* Left: Weekly Schedule */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon color="primary" /> Weekly Schedule
                        </Typography>

                        <Stack spacing={2}>
                            {schedule.map((day, dayIndex) => (
                                <Paper key={day.dayName} variant="outlined" sx={{ p: 2, bgcolor: day.enabled ? 'background.paper' : 'action.hover' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: day.enabled ? 2 : 0 }}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={day.enabled}
                                                    onChange={() => handleDayToggle(dayIndex)}
                                                />
                                            }
                                            label={<Typography variant="subtitle1" fontWeight="bold">{day.dayName}</Typography>}
                                        />
                                        {day.enabled && (
                                            <Button size="small" startIcon={<AddIcon />} onClick={() => addTimeWindow(dayIndex)}>
                                                Add Slot
                                            </Button>
                                        )}
                                    </Box>

                                    {day.enabled && (
                                        <Stack spacing={1}>
                                            {day.timeWindows.map((window, windowIndex) => (
                                                <Box key={windowIndex} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <TextField
                                                        type="time"
                                                        size="small"
                                                        value={window.start}
                                                        onChange={(e) => handleTimeChange(dayIndex, windowIndex, 'start', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
                                                    <Typography>-</Typography>
                                                    <TextField
                                                        type="time"
                                                        size="small"
                                                        value={window.end}
                                                        onChange={(e) => handleTimeChange(dayIndex, windowIndex, 'end', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                    />
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
                            ))}
                        </Stack>
                    </Card>
                </Grid>

                {/* Right: Exceptions */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EventBusyIcon color="error" /> Exceptions
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <TextField
                                type="date"
                                size="small"
                                fullWidth
                                value={newExceptionDate}
                                onChange={(e) => setNewExceptionDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <Button variant="contained" size="small" onClick={handleAddException} disabled={!newExceptionDate}>
                                Add
                            </Button>
                        </Box>

                        <Stack spacing={2}>
                            {exceptions.length === 0 && (
                                <Typography variant="body2" color="text.secondary" align="center">
                                    No exceptions configured.
                                </Typography>
                            )}
                            {exceptions.map((ex) => (
                                <Paper key={ex.id} variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <Box>
                                            <Typography variant="subtitle2">{ex.date}</Typography>
                                            <Chip label={ex.note} size="small" color="error" variant="outlined" sx={{ mt: 0.5 }} />
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
                        Configuring Availability for <strong>{PROVIDERS.find(p => p.id === selectedProvider)?.name}</strong>.
                        This will affect their visibility in the Booking Widget.
                    </Alert>
                </Grid>
            </Grid>
        </Box>
    );
}
