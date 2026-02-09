
import * as React from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    Typography,
    Box,
    Grid,
    InputAdornment,
    Tabs,
    Tab,
    Paper,
    Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslations } from 'next-intl';

// Also import internal preview
import WidgetPreview from '../components/WidgetPreview';
import PlanGuard from '@/components/PlanGuard';
import { WidgetConfig, WelcomeMessages } from '../../../types/settings';

const COLOR_PRESETS = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Purple', value: '#7c3aed' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Fiery Orange', value: '#ea580c' },
    { name: 'Midnight', value: '#0f172a' },
];

interface PropertiesTabProps {
    widgetConfig: WidgetConfig;
    setWidgetConfig: (config: WidgetConfig) => void;
    slug: string;
    setSlug: (slug: string) => void;
    onSave: () => void;
    logoUrl?: string; // New prop
}


export default function PropertiesTab({ widgetConfig, setWidgetConfig, slug, setSlug, onSave, logoUrl }: PropertiesTabProps) {
    const t = useTranslations('settings.general');
    const [copySuccess, setCopySuccess] = React.useState(false);
    const [editingLanguage, setEditingLanguage] = React.useState(widgetConfig.language);

    const publicLink = `https://agendar.holalucia.cl/${slug || 'tu-slug'}`;

    const handleCopyLink = () => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(publicLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

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
                <Stack spacing={3}>

                    {/* Public Page Section */}
                    <PlanGuard minPlan="PRO" featureName="Link de Empresa (/slug)" upgradeFeature="USAGE" variant="overlay">
                        <Box>
                            <Typography variant="h6">{t('publicBookingPage')}</Typography>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                                <TextField
                                    label={t('profileUrlSlug')}
                                    value={slug}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        setSlug(val);
                                    }}
                                    helperText={t('pageWillBeAt', { link: publicLink })}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">agendar.holalucia.cl/</InputAdornment>,
                                    }}
                                />
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={handleCopyLink}
                                    size="small"
                                >
                                    {copySuccess ? t('copied') : t('copyLink')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<OpenInNewIcon />}
                                    href={publicLink}
                                    target="_blank"
                                    size="small"
                                    disabled={!slug}
                                >
                                    {t('viewPage')}
                                </Button>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                {t('shareLinkDescription')}
                            </Typography>
                        </Box>
                    </PlanGuard>

                    <Divider />

                    {/* Branding Section */}
                    <PlanGuard minPlan="PRO" featureName="Imagen de Marca" upgradeFeature="USAGE" variant="overlay">
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
                        </Box>
                    </PlanGuard>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <TextField
                                select
                                fullWidth
                                label={t('position')}
                                value={widgetConfig.position}
                                onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
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
                                value={widgetConfig.language}
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
                            value={widgetConfig.welcomeMessages?.[editingLanguage] || ''}
                            onChange={(e) => handleWelcomeMessageChange(editingLanguage, e.target.value)}
                            placeholder={`Mensaje en ${editingLanguage.toUpperCase()}...`}
                            helperText={`Este mensaje aparecerá cuando el widget esté en: ${editingLanguage.toUpperCase()}`}
                        />
                    </Paper>

                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        size="large"
                        sx={{ alignSelf: 'start' }}
                        onClick={onSave}
                    >
                        {t('saveBranding')}
                    </Button>
                </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
                <WidgetPreview widgetConfig={widgetConfig} logoUrl={logoUrl} />
            </Grid>
        </Grid>
    );
}

