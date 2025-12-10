'use client';

import * as React from 'react';
import { PaletteName } from '../theme/palettes';

interface ThemeContextType {
    mode: 'light' | 'dark';
    toggleMode: () => void;
    paletteName: PaletteName;
    setPaletteName: (name: PaletteName) => void;
}

const ThemeContext = React.createContext<ThemeContextType>({
    mode: 'light',
    toggleMode: () => { },
    paletteName: 'default',
    setPaletteName: () => { },
});

export const useThemeContext = () => React.useContext(ThemeContext);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = React.useState<'light' | 'dark'>('light');
    const [paletteName, setPaletteName] = React.useState<PaletteName>('default');

    React.useEffect(() => {
        // Basic persistence
        const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark';
        const savedPalette = localStorage.getItem('themePalette') as PaletteName;
        if (savedMode) setMode(savedMode);
        if (savedPalette) setPaletteName(savedPalette);
    }, []);

    const toggleMode = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
    };

    const changePalette = (name: PaletteName) => {
        setPaletteName(name);
        localStorage.setItem('themePalette', name);
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleMode, paletteName, setPaletteName: changePalette }}>
            {children}
        </ThemeContext.Provider>
    );
};
