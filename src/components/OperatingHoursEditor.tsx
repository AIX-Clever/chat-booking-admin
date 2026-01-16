'use client';

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Stack,
    Switch,
    FormControlLabel,
    IconButton,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format } from 'date-fns';

interface TimeWindow {
    start: string; // "HH:mm"
    end: string;   // "HH:mm"
}

interface DaySchedule {
    day: string; // "MON", "TUE", etc.
    dayName: string; // Display name
    enabled: boolean;
    timeWindows: TimeWindow[];
}

interface OperatingHour {
    day: string;
    start: string;
    end: string;
}

interface OperatingHoursEditorProps {
    value: OperatingHour[]; // JSON format from backend
    onChange: (value: OperatingHour[]) => void;
}

const DAYS: { day: string; dayName: string }[] = [
    { day: 'MON', dayName: 'Lunes' },
    { day: 'TUE', dayName: 'Martes' },
    { day: 'WED', dayName: 'Miércoles' },
    { day: 'THU', dayName: 'Jueves' },
    { day: 'FRI', dayName: 'Viernes' },
    { day: 'SAT', dayName: 'Sábado' },
    { day: 'SUN', dayName: 'Domingo' },
];

export const OperatingHoursEditor: React.FC<OperatingHoursEditorProps> = ({ value, onChange }) => {
    // Convert from backend format to internal state
    const initializeSchedule = (): DaySchedule[] => {
        return DAYS.map(({ day, dayName }) => {
            const dayHours = value.filter(h => h.day === day);
            return {
                day,
                dayName,
                enabled: dayHours.length > 0,
                timeWindows: dayHours.map(h => ({ start: h.start, end: h.end }))
            };
        });
    };

    const [schedule, setSchedule] = React.useState<DaySchedule[]>(initializeSchedule());

    // Helper to convert schedule to backend format
    const scheduleToValue = (newSchedule: DaySchedule[]): OperatingHour[] => {
        const newValue: OperatingHour[] = [];
        newSchedule.forEach(day => {
            if (day.enabled) {
                day.timeWindows.forEach(window => {
                    newValue.push({
                        day: day.day,
                        start: window.start,
                        end: window.end
                    });
                });
            }
        });
        return newValue;
    };

    const handleDayToggle = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule[index].enabled = !newSchedule[index].enabled;
        if (newSchedule[index].enabled && newSchedule[index].timeWindows.length === 0) {
            newSchedule[index].timeWindows.push({ start: '09:00', end: '18:00' });
        }
        setSchedule(newSchedule);
        onChange(scheduleToValue(newSchedule));
    };

    const handleTimeChange = (dayIndex: number, windowIndex: number, field: 'start' | 'end', value: string) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows[windowIndex][field] = value;
        setSchedule(newSchedule);
        onChange(scheduleToValue(newSchedule));
    };

    const addTimeWindow = (dayIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows.push({ start: '18:00', end: '20:00' });
        setSchedule(newSchedule);
        onChange(scheduleToValue(newSchedule));
    };

    const removeTimeWindow = (dayIndex: number, windowIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[dayIndex].timeWindows.splice(windowIndex, 1);
        setSchedule(newSchedule);
        onChange(scheduleToValue(newSchedule));
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
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Horarios de Operación de la Sala
            </Typography>
            <Stack spacing={1.5}>
                {schedule.map((day, dayIndex) => (
                    <Paper
                        key={day.day}
                        variant="outlined"
                        sx={{
                            p: 1.5,
                            bgcolor: day.enabled ? 'background.paper' : 'action.hover',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: day.enabled ? 1.5 : 0 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={day.enabled}
                                        onChange={() => handleDayToggle(dayIndex)}
                                    />
                                }
                                label={
                                    <Typography variant="body2" fontWeight="medium">
                                        {day.dayName}
                                    </Typography>
                                }
                            />
                            {day.enabled && (
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => addTimeWindow(dayIndex)}
                                    sx={{ fontSize: '0.75rem' }}
                                >
                                    Agregar horario
                                </Button>
                            )}
                        </Box>

                        {day.enabled && (
                            <Stack spacing={1}>
                                {day.timeWindows.map((window, windowIndex) => (
                                    <Box key={windowIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                                            <TimePicker
                                                label="Inicio"
                                                value={parseTime(window.start)}
                                                onChange={(newValue) => handleTimeChange(dayIndex, windowIndex, 'start', formatTime(newValue))}
                                                slotProps={{ textField: { size: 'small', sx: { width: 110 } } }}
                                                ampm={false}
                                            />
                                            <Typography variant="body2" color="text.secondary">-</Typography>
                                            <TimePicker
                                                label="Fin"
                                                value={parseTime(window.end)}
                                                onChange={(newValue) => handleTimeChange(dayIndex, windowIndex, 'end', formatTime(newValue))}
                                                slotProps={{ textField: { size: 'small', sx: { width: 110 } } }}
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
                ))}
            </Stack>
        </Box>
    );
};
