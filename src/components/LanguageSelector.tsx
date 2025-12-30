'use client';

import { useLocale } from 'next-intl';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useState } from 'react';

const languages = [
    { code: 'es', flag: '🇪🇸', name: 'Español' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'pt', flag: '🇧🇷', name: 'Português' }
];

export default function LanguageSelector() {
    const locale = useLocale();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleChange = (newLocale: string) => {
        // Dispatch custom event for language change
        const event = new CustomEvent('languageChange', { detail: { locale: newLocale } });
        window.dispatchEvent(event);
        handleClose();
    };

    const currentLanguage = languages.find(l => l.code === locale);

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{ ml: 1 }}
                aria-label="change language"
            >
                <span style={{ fontSize: '1.2rem' }}>{currentLanguage?.flag}</span>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {languages.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        onClick={() => handleChange(lang.code)}
                        selected={locale === lang.code}
                    >
                        <ListItemIcon>
                            <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                        </ListItemIcon>
                        <ListItemText>{lang.name}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
