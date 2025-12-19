'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import { ThemeContextProvider, useThemeContext } from '../../context/ThemeContext';
import { palettes } from '../../theme/palettes';
import { Public_Sans } from 'next/font/google';

const publicSans = Public_Sans({
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
    display: 'swap',
});

// Custom Shadows
const customShadows = (mode: 'light' | 'dark') => {
    const transparent = 'rgba(145, 158, 171, 0.16)';
    return mode === 'light'
        ? [
            'none',
            `0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)`,
            `0 0 2px 0 ${transparent}, 0 12px 24px -4px ${transparent}`, // Card Shadow (elevation 2)
            // ... fill others as needed, defaulting to standard MUI for higher elevations if simple
            ...Array(23).fill('none').map((_, i) => `0px ${i + 4}px ${i * 2}px rgba(0,0,0,0.1)`)
        ]
        : [
            'none',
            'none',
            `0 0 2px 0 rgba(0,0,0,0.24), 0 12px 24px -4px rgba(0,0,0,0.24)`,
            ...Array(23).fill('none') // Simpler dark shadows
        ];
};

function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const { mode, paletteName } = useThemeContext();

    const theme = React.useMemo(() => {
        const currentPalette = palettes[paletteName][mode];

        // Core definition
        return createTheme({
            typography: {
                fontFamily: publicSans.style.fontFamily,
                h1: { fontWeight: 800 },
                h2: { fontWeight: 800 },
                h3: { fontWeight: 700 },
                h4: { fontWeight: 700 },
                h6: { fontWeight: 700 },
                button: { fontWeight: 700, textTransform: 'capitalize' },
            },
            palette: {
                mode,
                ...currentPalette,
            },
            shape: {
                borderRadius: 16,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shadows: customShadows(mode) as any, // Cast to any to bypass strict tuple check for now
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        body: {
                            backgroundColor: currentPalette.background?.default,
                        }
                    }
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none', // Remove dark mode gradient
                            boxShadow: customShadows(mode)[2],
                            borderRadius: 16,
                            position: 'relative',
                            zIndex: 0,
                        },
                    },
                },
                MuiPaper: {
                    defaultProps: {
                        elevation: 0
                    },
                    styleOverrides: {
                        root: {
                            backgroundImage: 'none',
                        }
                    }
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                        },
                        contained: {
                            boxShadow: 'none',
                            '&:hover': {
                                boxShadow: 'none',
                            }
                        }
                    }
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            boxShadow: 'none',
                        }
                    }
                }
            }
        });
    }, [mode, paletteName]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
    return (
        <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
            <ThemeContextProvider>
                <ThemeWrapper>
                    {children}
                </ThemeWrapper>
            </ThemeContextProvider>
        </NextAppDirEmotionCacheProvider>
    );
}
