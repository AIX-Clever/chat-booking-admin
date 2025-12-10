import { PaletteOptions } from '@mui/material/styles';

export type PaletteName = 'default' | 'ocean' | 'sunset' | 'forest' | 'purple';

interface PaletteCollection {
    [key: string]: {
        light: PaletteOptions;
        dark: PaletteOptions;
        primaryColor: string; // Used for the switcher UI
    };
}

export const palettes: PaletteCollection = {
    default: {
        primaryColor: '#00A76F', // Greenish-teal pop often used in "Minimal" themes (like the example link)
        light: {
            primary: { main: '#00A76F', contrastText: '#ffffff' },
            secondary: { main: '#8E33FF' },
            background: { default: '#F9FAFB', paper: '#FFFFFF' }, // Very light grey bg
            text: { primary: '#212B36', secondary: '#637381' },
        },
        dark: {
            primary: { main: '#00A76F', contrastText: '#ffffff' },
            secondary: { main: '#8E33FF' },
            background: { default: '#161C24', paper: '#212B36' },
            text: { primary: '#FFFFFF', secondary: '#919EAB' },
        },
    },
    ocean: {
        primaryColor: '#00695c',
        light: {
            primary: { main: '#00695c' },
            secondary: { main: '#00acc1' },
            background: { default: '#e0f2f1', paper: '#ffffff' },
        },
        dark: {
            primary: { main: '#4db6ac' },
            secondary: { main: '#80deea' },
            background: { default: '#00251a', paper: '#004d40' },
        },
    },
    sunset: {
        primaryColor: '#e65100',
        light: {
            primary: { main: '#e65100' },
            secondary: { main: '#ff9800' },
            background: { default: '#fff3e0', paper: '#ffffff' },
        },
        dark: {
            primary: { main: '#ffb74d' },
            secondary: { main: '#ffcc80' },
            background: { default: '#3e2723', paper: '#4e342e' },
        },
    },
    forest: {
        primaryColor: '#2e7d32',
        light: {
            primary: { main: '#2e7d32' },
            secondary: { main: '#66bb6a' },
            background: { default: '#e8f5e9', paper: '#ffffff' },
        },
        dark: {
            primary: { main: '#81c784' },
            secondary: { main: '#a5d6a7' },
            background: { default: '#1b5e20', paper: '#2e7d32' },
        },
    },
    purple: {
        primaryColor: '#7b1fa2',
        light: {
            primary: { main: '#7b1fa2' },
            secondary: { main: '#ba68c8' },
            background: { default: '#f3e5f5', paper: '#ffffff' },
        },
        dark: {
            primary: { main: '#ce93d8' },
            secondary: { main: '#e1bee7' },
            background: { default: '#4a148c', paper: '#6a1b9a' },
        }
    }
};
