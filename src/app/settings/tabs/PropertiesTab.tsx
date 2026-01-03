
import * as React from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    Typography,
    Box,
    Grid
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslations } from 'next-intl';

/* --- Constants could be moved to a shared config --- */
const COLOR_PRESETS = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Purple', value: '#7c3aed' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Fiery Orange', value: '#ea580c' },
    { name: 'Midnight', value: '#0f172a' },
];

interface PropertiesTabProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    widgetConfig: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setWidgetConfig: (config: any) => void;
    onSave: () => void;
}

export default function PropertiesTab({ widgetConfig, setWidgetConfig, onSave }: PropertiesTabProps) {
    const t = useTranslations('settings.general');

    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
                <Stack spacing={3}>
                    <div>
                        <Typography variant="subtitle2" gutterBottom>{t('primaryColor')}</Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                            {COLOR_PRESETS.map((preset) => (
                                <Box
                                    key={preset.value}
                                    onClick={() => setWidgetConfig({ ...widgetConfig, primaryColor: preset.value })}
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: '50%',
                                        bgcolor: preset.value,
                                        cursor: 'pointer',
                                        border: widgetConfig.primaryColor === preset.value ? '3px solid white' : '1px solid rgba(0,0,0,0.1)',
                                        boxShadow: widgetConfig.primaryColor === preset.value ? `0 0 0 2px ${preset.value}` : 'none',
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'scale(1.1)' }
                                    }}
                                    title={preset.name}
                                />
                            ))}
                            <Box sx={{ position: 'relative', ml: 2, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>{t('custom')}</Typography>
                                <input
                                    type="color"
                                    value={widgetConfig.primaryColor}
                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, primaryColor: e.target.value })}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        padding: 0,
                                        border: '1px solid #ddd',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        backgroundColor: 'transparent'
                                    }}
                                    title="Custom Color"
                                />
                            </Box>
                        </Stack>
                    </div>
                    <TextField
                        select
                        label={t('position')}
                        value={widgetConfig.position}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
                    >
                        <MenuItem value="bottom-right">{t('positions.bottomRight')}</MenuItem>
                        <MenuItem value="bottom-left">{t('positions.bottomLeft')}</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label={t('language')}
                        value={widgetConfig.language}
                        onChange={(e) => setWidgetConfig({ ...widgetConfig, language: e.target.value })}
                        helperText={t('languageHelper')} // Add this key or use hardcoded string for now
                    >
                        <MenuItem value="es">{t('languages.es')}</MenuItem>
                        <MenuItem value="en">{t('languages.en')}</MenuItem>
                        <MenuItem value="pt">{t('languages.pt')}</MenuItem>
                    </TextField>
                    <TextField
                        label={t('welcomeMessage')}
                        multiline
                        rows={3}
                        value={widgetConfig.welcomeMessages?.[widgetConfig.language] || ''}
                        onChange={(e) => {
                            const newMessages = {
                                ...(widgetConfig.welcomeMessages || {}),
                                [widgetConfig.language]: e.target.value
                            };
                            setWidgetConfig({ ...widgetConfig, welcomeMessages: newMessages });
                        }}
                        helperText={`Editing message for: ${widgetConfig.language.toUpperCase()}`}
                    />
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        sx={{ alignSelf: 'start' }}
                        onClick={onSave}
                    >
                        {t('saveBranding')}
                    </Button>
                </Stack>
            </Grid>
            {/* We could move the Preview to a separate component too, but for now user said 'no redesign' so we keep structure similar but maybe cleaner */
            /* Actually, the current page col-locates input and preview. I will separate the input part (PropertiesTab) and maybe keep Preview in page or pass it?
               In the original code, they are side-by-side in a Grid.
               PropertiesTabProps suggests only inputs.
               Let's assume PropertiesTab includes the Preview if we want to match the tab content.
               Yes, 'Tab 1: Widget & Branding' contains the Grid with Inputs AND Preview.
            */}
            <Grid item xs={12} md={5}>
                {/* We will need to import/recreate the preview here or pass it as children. 
                    For simplicity, I'll copy the preview code here as well to keep the tab self-contained.
                    Wait, preview needs imports too (Avatar, Icons).
                */}
                <WidgetPreview widgetConfig={widgetConfig} />
            </Grid>
        </Grid>
    );
}

// Minimal Preview Component internal to this file to avoid file explosion, or I can put it in a separate file if preferred.
// Let's create a separate WidgetPreview.tsx to make this file cleaner.
import WidgetPreview from '../components/WidgetPreview';
