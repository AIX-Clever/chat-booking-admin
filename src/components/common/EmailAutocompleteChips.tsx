import * as React from 'react';
import { Box, Chip } from '@mui/material';

interface EmailAutocompleteChipsProps {
    email: string;
    onSelect: (newEmail: string) => void;
}

const COMMON_DOMAINS = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com', '@icloud.com'];

export default function EmailAutocompleteChips({ email, onSelect }: EmailAutocompleteChipsProps) {
    if (!email || email.includes('@')) return null;

    return (
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {COMMON_DOMAINS.map(domain => (
                <Chip
                    key={domain}
                    label={domain}
                    size="small"
                    variant="outlined"
                    onClick={() => onSelect(`${email}${domain}`)}
                    clickable
                />
            ))}
        </Box>
    );
}
