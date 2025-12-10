'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PaletteIcon from '@mui/icons-material/Palette';
import { useThemeContext } from '../../context/ThemeContext';
import { palettes, PaletteName } from '../../theme/palettes';

export default function ThemeSwitcher() {
    const { mode, toggleMode, setPaletteName, paletteName } = useThemeContext();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePaletteChange = (name: PaletteName) => {
        setPaletteName(name);
        handleClose();
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Toggle light/dark theme">
                <IconButton onClick={toggleMode} color="inherit">
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
            </Tooltip>

            <Tooltip title="Change color palette">
                <IconButton onClick={handleClick} color="inherit">
                    <PaletteIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: { mt: 1.5 }
                }}
            >
                {Object.entries(palettes).map(([name, config]) => (
                    <MenuItem
                        key={name}
                        onClick={() => handlePaletteChange(name as PaletteName)}
                        selected={paletteName === name}
                        sx={{ gap: 2 }}
                    >
                        <Box
                            sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: config.primaryColor,
                                border: '1px solid #ccc'
                            }}
                        />
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}
