import * as React from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    Typography,
    Box,
    Grid,
    Tabs,
    Tab,
    Paper,
    Divider,
    Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useTranslations } from 'next-intl';

import WidgetPreview from '../../../settings/components/WidgetPreview';
import { WidgetConfig, WelcomeMessages } from '@/types/settings';

const COLOR_PRESETS = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Purple', value: '#7c3aed' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Fiery Orange', value: '#ea580c' },
    { name: 'Midnight', value: '#0f172a' },
];

interface WidgetCustomizerProps {
    widgetConfig: WidgetConfig;
    setWidgetConfig: (config: WidgetConfig) => void;
    onSave: () => void;
    logoUrl?: string;
    loading?: boolean;
}

export default function WidgetCustomizer({ widgetConfig, setWidgetConfig, onSave, logoUrl, loading }: WidgetCustomizerProps) {
    const t = useTranslations('settings.general');
    const [editingLanguage, setEditingLanguage] = React.useState(widgetConfig.language || 'es');

    const handleWelcomeMessageChange = (lang: string, value: string) => {
        const newMessages = {
            ...(widgetConfig.welcomeMessages || {}),
            [lang]: value
        } as WelcomeMessages;
        setWidgetConfig({ ...widgetConfig, welcomeMessages: newMessages });
    };

    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
                <Stack spacing={4}>
                    <Alert severity="info" sx={{ mb: 1 }}>
                        <strong>Personaliza el aspecto de tu página de reservas y Asistente.</strong> Cambia los colores, disposición y textos de bienvenida aquí.
                    </Alert>

                    {/* Branding Section */}
                    <Box>
                        <Typography variant="h6" gutterBottom>{t('primaryColor')}</Typography>
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
                                    value={widgetConfig.primaryColor || '#2563eb'}
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
                    </Box>

                    <Divider />

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('position')}
                                value={widgetConfig.position || 'bottom-right'}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value as any })}
                            >
                                <MenuItem value="bottom-right">{t('positions.bottomRight')}</MenuItem>
                                <MenuItem value="bottom-left">{t('positions.bottomLeft')}</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('language')}
                                value={widgetConfig.language || 'es'}
                                onChange={(e) => {
                                    setWidgetConfig({ ...widgetConfig, language: e.target.value });
                                    setEditingLanguage(e.target.value);
                                }}
                                helperText={t('languageHelper')}
                            >
                                <MenuItem value="es">{t('languages.es')}</MenuItem>
                                <MenuItem value="en">{t('languages.en')}</MenuItem>
                                <MenuItem value="pt">{t('languages.pt')}</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>

                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>{t('welcomeMessage')}</Typography>
                        <Tabs
                            value={editingLanguage}
                            onChange={(_, val) => setEditingLanguage(val)}
                            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Español" value="es" />
                            <Tab label="English" value="en" />
                            <Tab label="Português" value="pt" />
                        </Tabs>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={widgetConfig.welcomeMessages?.[editingLanguage as keyof WelcomeMessages] || ''}
                            onChange={(e) => handleWelcomeMessageChange(editingLanguage, e.target.value)}
                            placeholder={`Mensaje en ${editingLanguage.toUpperCase()}...`}
                            helperText={`Este mensaje aparecerá cuando el chat esté en: ${editingLanguage.toUpperCase()}`}
                        />
                    </Paper>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        size="large"
                        sx={{ alignSelf: 'start', mt: 2 }}
                        onClick={onSave}
                        disabled={loading}
                    >
                        {loading ? 'Guardando...' : t('saveBranding')}
                    </Button>
                </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
                <WidgetPreview widgetConfig={widgetConfig} logoUrl={logoUrl} />
            </Grid>
        </Grid>
    );
}
