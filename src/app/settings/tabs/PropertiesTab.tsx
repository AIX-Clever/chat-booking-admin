
import * as React from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    Typography,
    Box,
    Grid,
    InputAdornment
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslations } from 'next-intl';

// Also import internal preview
import WidgetPreview from '../components/WidgetPreview';

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
    slug: string;
    setSlug: (slug: string) => void;
    onSave: () => void;
}

export default function PropertiesTab({ widgetConfig, setWidgetConfig, slug, setSlug, onSave }: PropertiesTabProps) {
    const t = useTranslations('settings.general');
    const [copySuccess, setCopySuccess] = React.useState(false);

    const publicLink = `https://agendar.holalucia.cl/${slug || 'tu-slug'}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(publicLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
                <Stack spacing={3}>

                    {/* Public Page Section */}

                    <Typography variant="h6">Public Booking Page</Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <TextField
                            label="Profile URL (Slug)"
                            value={slug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                setSlug(val);
                            }}
                            helperText={`Your page will be at: ${publicLink}`}
                            fullWidth
                            InputProps={{
                                startAdornment: <InputAdornment position="start">agendar.holalucia.cl/</InputAdornment>,
                            }}
                        />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopyLink}
                            size="small"
                        >
                            {copySuccess ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<OpenInNewIcon />}
                            href={publicLink}
                            target="_blank"
                            size="small"
                            disabled={!slug}
                        >
                            View Page
                        </Button>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                        Share this link with your clients so they can book appointments with you.
                    </Typography>

                    <Box sx={{ my: 2, height: 1, bgcolor: 'divider' }} />

                    {/* Branding Section */}
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
                        helperText={t('languageHelper')}
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
            <Grid item xs={12} md={5}>
                <WidgetPreview widgetConfig={widgetConfig} />
            </Grid>
        </Grid>
    );
}
