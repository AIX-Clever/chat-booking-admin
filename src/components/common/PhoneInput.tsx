import React, { useState, useEffect } from 'react';
import {
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    SelectChangeEvent,
    Box,
    TextFieldProps
} from '@mui/material';

// Common LATAM & NA Country Codes
const COUNTRY_CODES = [
    { code: '+56', label: '🇨🇱  (+56)', name: 'Chile' },
    { code: '+54', label: '🇦🇷  (+54)', name: 'Argentina' },
    { code: '+57', label: '🇨🇴  (+57)', name: 'Colombia' },
    { code: '+51', label: '🇵🇪  (+51)', name: 'Perú' },
    { code: '+52', label: '🇲🇽  (+52)', name: 'México' },
    { code: '+34', label: '🇪🇸  (+34)', name: 'España' },
    { code: '+1', label: '🇺🇸/🇨🇦 (+1)', name: 'USA/Canadá' },
    { code: '+598', label: '🇺🇾  (+598)', name: 'Uruguay' },
    { code: '+593', label: '🇪🇨  (+593)', name: 'Ecuador' },
    { code: '+591', label: '🇧🇴  (+591)', name: 'Bolivia' },
    { code: '+595', label: '🇵🇾  (+595)', name: 'Paraguay' },
    { code: '+506', label: '🇨🇷  (+506)', name: 'Costa Rica' },
    { code: '+507', label: '🇵🇦  (+507)', name: 'Panamá' },
    { code: '+58', label: '🇻🇪  (+58)', name: 'Venezuela' },
];

interface PhoneInputProps extends Omit<TextFieldProps, 'onChange'> {
    value: string;
    onChange: (e: { target: { name: string; value: string } }) => void;
    defaultCountryCode?: string;
}

export default function PhoneInput({
    value = '',
    onChange,
    name = 'phone',
    defaultCountryCode = '+56',
    ...props
}: PhoneInputProps) {
    const [countryCode, setCountryCode] = useState(defaultCountryCode);
    const [localNumber, setLocalNumber] = useState('');

    // Sync from parent value to local state
    useEffect(() => {
        if (!value) {
            setLocalNumber('');
            // Optional: You could reset to defaultCountryCode here, 
            // but keeping the last selected is usually better UX if they just cleared the input.
            return;
        }

        // Extremely simple parsing: Find matching prefix
        let matchedCode = '';
        // Sort by length descending to match longest prefixes first (e.g., +598 before +5)
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

        for (const country of sortedCodes) {
            if (value.startsWith(country.code)) {
                matchedCode = country.code;
                break;
            }
        }

        if (matchedCode) {
            setCountryCode(matchedCode);
            setLocalNumber(value.substring(matchedCode.length).trim());
        } else {
            // If it doesn't match any known prefix, try to guess if it has a generic + prefix
            if (value.startsWith('+')) {
                // Not in our list, but it's an international number. Just put it all in localNumber for now
                setLocalNumber(value);
            } else {
                // Assume it's a local number without a prefix yet
                setLocalNumber(value);
                // We don't force a country code update here to avoid surprising the user
            }
        }
    }, [value]);

    const handleCodeChange = (e: SelectChangeEvent<string>) => {
        const newCode = e.target.value;
        setCountryCode(newCode);
        triggerParentChange(newCode, localNumber);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newNumber = e.target.value;
        // Basic cleanup (allow only numbers, spaces, and hyphens if you want, but sticking to numbers is safer)
        const cleanedNumber = newNumber.replace(/[^\d\s-]/g, '');
        setLocalNumber(cleanedNumber);

        triggerParentChange(countryCode, cleanedNumber);
    };

    const triggerParentChange = (code: string, number: string) => {
        // If number is completely empty, it might be better to send empty string
        // rather than just the country code, to avoid saving "+56" to DB.
        const combinedValue = number.trim() ? `${code}${number.trim()}` : '';
        onChange({
            target: {
                name: name,
                value: combinedValue
            }
        });
    };

    return (
        <TextField
            fullWidth
            name={name}
            value={localNumber}
            onChange={handleNumberChange}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Select
                            value={countryCode}
                            onChange={handleCodeChange}
                            variant="standard"
                            disableUnderline
                            sx={{
                                width: '70px', // Allow enough space for flag and code
                                '& .MuiSelect-select': {
                                    paddingLeft: 0,
                                    paddingRight: '0 !important', // Override default right padding for dropdown
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.875rem' // Slightly smaller to fit better
                                },
                                '& .MuiSvgIcon-root': {
                                    display: 'none' // Hide the dropdown arrow
                                }
                            }}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 300,
                                    },
                                },
                            }}
                        >
                            {COUNTRY_CODES.map((country) => (
                                <MenuItem key={country.code} value={country.code} sx={{ fontSize: '0.875rem' }}>
                                    {country.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <Box sx={{
                            height: 24,
                            width: '1px',
                            bgcolor: 'divider',
                            mx: 1
                        }} />
                    </InputAdornment>
                ),
            }}
            {...props}
        />
    );
}
