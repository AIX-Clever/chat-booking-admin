'use client';

import * as React from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
    Typography,
    Box,
    Card,
    Tabs,
    Tab,
    Stack,
    TextField,
    MenuItem,
    Button,
    Grid,
    Paper,
    Avatar,
    Radio,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import LockIcon from '@mui/icons-material/Lock';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { generateClient } from 'aws-amplify/api';
import { UPDATE_TENANT } from '../../graphql/queries';

// --- Types ---

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

// --- Mock Data & Constants ---
const PLAN_LEVELS: Record<string, number> = {
    'LITE': 1,
    'PRO': 2,
    'BUSINESS': 3,
    'ENTERPRISE': 4
};

const COLOR_PRESETS = [
    { name: 'Default Blue', value: '#2563eb' },
    { name: 'Royal Purple', value: '#7c3aed' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Fiery Orange', value: '#ea580c' },
    { name: 'Midnight', value: '#0f172a' },
];

const AI_MODES = [
    {
        id: 'fsm',
        name: 'FSM (Básico)',
        desc: 'Árbol de decisiones determinista. Ideal para flujos fijos y control total.',
        price: 'Included',
        minPlan: 'LITE'
    },
    {
        id: 'nlp',
        name: 'NLP Asistido',
        desc: 'Usa IA ligera para detectar intención y entidades, pero sigue reglas estrictas.',
        price: 'Low Cost',
        minPlan: 'PRO'
    },
    {
        id: 'agent',
        name: 'Agente Full AI',
        desc: 'Agente autónomo con razonamiento (Bedrock + Sonnet). Conversación natural.',
        price: 'High Performance',
        minPlan: 'BUSINESS'
    }
];

const MOCK_KEYS = [
    { id: '1', name: 'Web Principal', prefix: 'sk_live_83...', status: 'active', created: '2024-01-15' },
    { id: '2', name: 'App Móvil Dev', prefix: 'sk_test_92...', status: 'revoked', created: '2023-11-20' }
];

export default function SettingsPage() {
    const client = generateClient();
    const [tabValue, setTabValue] = React.useState(0);
    const [hasMounted, setHasMounted] = React.useState(false);

    // User Plan State (Mock)
    const [currentPlan, setCurrentPlan] = React.useState('PRO');
    const [upgradeDialogOpen, setUpgradeDialogOpen] = React.useState(false);

    // Widget State
    const [widgetConfig, setWidgetConfig] = React.useState({
        primaryColor: '#2563eb',
        position: 'bottom-right',
        language: 'es',
        welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?'
    });

    // AI State
    const [aiMode, setAiMode] = React.useState('nlp');

    // Keys State
    const [apiKeys, setApiKeys] = React.useState(MOCK_KEYS);
    const [confirmRevokeOpen, setConfirmRevokeOpen] = React.useState(false);
    const [keyToRevoke, setKeyToRevoke] = React.useState<string | null>(null);
    const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
    const [newKeyName, setNewKeyName] = React.useState('');

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const isPlanSufficient = (minPlan: string) => {
        return PLAN_LEVELS[currentPlan] >= PLAN_LEVELS[minPlan];
    };

    const handleSelectAiMode = (mode: typeof AI_MODES[0]) => {
        if (isPlanSufficient(mode.minPlan)) {
            setAiMode(mode.id);
        } else {
            setUpgradeDialogOpen(true);
        }
    };

    const handleDeleteKey = (id: string) => {
        setKeyToRevoke(id);
        setConfirmRevokeOpen(true);
    };

    const confirmRevoke = () => {
        if (keyToRevoke) {
            setApiKeys(prev => prev.map(k => k.id === keyToRevoke ? { ...k, status: 'revoked' } : k));
            setConfirmRevokeOpen(false);
            setKeyToRevoke(null);
        }
    };

    const handleCreateKey = () => {
        if (!newKeyName) return;
        const newKey = {
            id: Math.random().toString(),
            name: newKeyName,
            prefix: `sk_live_${Math.floor(Math.random() * 1000)}...`,
            status: 'active',
            created: new Date().toISOString().split('T')[0]
        };
        setApiKeys(prev => [newKey, ...prev]);
        setCreateKeyOpen(false);
        setNewKeyName('');
    };

    const handleSaveBranding = async () => {
        try {
            await client.graphql({
                query: UPDATE_TENANT,
                variables: {
                    input: {
                        settings: JSON.stringify(widgetConfig)
                    }
                }
            });
            alert('Branding saved successfully!');
        } catch (error) {
            console.error('Error saving branding:', error);
            alert('Failed to save branding.');
        }
    };

    return (
        <>
            {/* ... ConfirmDialog ... */}
            <Typography variant="h4" sx={{ mb: 4 }}>Settings</Typography>

            <Paper sx={{ width: '100%' }}>
                {/* ... Tabs ... */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleChangeTab} aria-label="settings tabs">
                        <Tab label="Widget & Branding" icon={<ChatIcon />} iconPosition="start" />
                        <Tab label="AI Configuration" icon={<AutoAwesomeIcon />} iconPosition="start" />
                        <Tab label="API Keys" icon={<VpnKeyIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {/* --- Tab 1: Widget & Branding --- */}
                <CustomTabPanel value={tabValue} index={0}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={7}>
                            <Stack spacing={3}>
                                <div>
                                    <Typography variant="subtitle2" gutterBottom>Primary Color</Typography>
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
                                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Custom:</Typography>
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
                                    label="Position"
                                    value={widgetConfig.position}
                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, position: e.target.value })}
                                >
                                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Language"
                                    value={widgetConfig.language}
                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, language: e.target.value })}
                                >
                                    <MenuItem value="es">Español</MenuItem>
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="pt">Português</MenuItem>
                                </TextField>
                                <TextField
                                    label="Welcome Message"
                                    multiline
                                    rows={3}
                                    value={widgetConfig.welcomeMessage}
                                    onChange={(e) => setWidgetConfig({ ...widgetConfig, welcomeMessage: e.target.value })}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                    sx={{ alignSelf: 'start' }}
                                    onClick={handleSaveBranding}
                                >
                                    Save Branding
                                </Button>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Card variant="outlined" sx={{ p: 0, bgcolor: '#f1f5f9', height: 500, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
                                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
                                    <Typography variant="overline" color="text.secondary" fontWeight="bold">Live Web Preview</Typography>
                                </Box>

                                {/* Simulated Web Content */}
                                <Box sx={{ flex: 1, p: 4, opacity: 0.5 }}>
                                    <Box sx={{ height: 200, bgcolor: '#cbd5e1', borderRadius: 2, mb: 2, width: '70%' }} />
                                    <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, mb: 1, width: '100%' }} />
                                    <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, mb: 1, width: '90%' }} />
                                    <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, width: '60%' }} />
                                </Box>

                                {/* Widget Window */}
                                <Paper
                                    elevation={4}
                                    sx={{
                                        position: 'absolute',
                                        bottom: 90,
                                        [widgetConfig.position === 'bottom-right' ? 'right' : 'left']: 24,
                                        width: 320,
                                        height: 380,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    {/* Header */}
                                    <Box sx={{ p: 2, bgcolor: widgetConfig.primaryColor, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}><AutoAwesomeIcon sx={{ fontSize: 18 }} /></Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>Chat Support</Typography>
                                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Online</Typography>
                                            </Box>
                                        </Box>
                                        <IconButton size="small" sx={{ color: 'white' }}><CloseIcon /></IconButton>
                                    </Box>

                                    {/* Messages */}
                                    <Box sx={{ flex: 1, p: 2, bgcolor: '#f8fafc', overflowY: 'auto' }}>
                                        <Stack spacing={2} alignItems="flex-start">
                                            <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: '0 12px 12px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', maxWidth: '85%' }}>
                                                <Typography variant="body2" color="text.secondary">{widgetConfig.welcomeMessage}</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    {/* Input Area */}
                                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: 1, borderRadius: 2 }}>
                                            <Typography variant="body2" color="text.disabled" sx={{ flex: 1, ml: 1 }}>Type a message...</Typography>
                                            <IconButton size="small" sx={{ color: widgetConfig.primaryColor }}>
                                                <SendIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Launcher FAB */}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 24,
                                        [widgetConfig.position === 'bottom-right' ? 'right' : 'left']: 24,
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        bgcolor: widgetConfig.primaryColor,
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: 3,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <ChatIcon />
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </CustomTabPanel>

                {/* --- Tab 2: AI Configuration --- */}
                <CustomTabPanel value={tabValue} index={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ mr: 2 }}>Intelligence Mode</Typography>
                        <Chip label={`Current Plan: ${currentPlan}`} color="primary" variant="outlined" size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Select the AI model that powers your conversational agent. Higher tiers require advanced plans.
                    </Typography>

                    <Grid container spacing={3}>
                        {AI_MODES.map((mode) => {
                            const locked = !isPlanSufficient(mode.minPlan);
                            const active = aiMode === mode.id;

                            return (
                                <Grid item xs={12} md={4} key={mode.id}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            p: 3,
                                            cursor: 'pointer',
                                            position: 'relative',
                                            borderColor: active ? 'primary.main' : 'divider',
                                            bgcolor: active ? 'primary.50' : (locked ? '#f9fafb' : 'background.paper'),
                                            transition: 'all 0.2s',
                                            opacity: locked ? 0.8 : 1,
                                            '&:hover': {
                                                borderColor: active ? 'primary.main' : 'primary.light',
                                                transform: locked ? 'none' : 'translateY(-2px)'
                                            }
                                        }}
                                        onClick={() => handleSelectAiMode(mode)}
                                    >
                                        {locked && (
                                            <Chip
                                                icon={<LockIcon sx={{ fontSize: 14 }} />}
                                                label={`Requires ${mode.minPlan}`}
                                                size="small"
                                                color="warning"
                                                sx={{ position: 'absolute', top: 12, right: 12, fontWeight: 'bold' }}
                                            />
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: locked ? 2 : 0 }}>
                                            <Typography variant="subtitle1" fontWeight="bold" color={locked ? 'text.secondary' : 'text.primary'}>
                                                {mode.name}
                                            </Typography>
                                            {!locked && <Radio checked={active} value={mode.id} size="small" />}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                                            {mode.desc}
                                        </Typography>
                                        <Chip
                                            label={mode.price}
                                            size="small"
                                            variant={mode.id === 'agent' ? 'filled' : 'outlined'}
                                            color={mode.id === 'agent' ? 'primary' : 'default'}
                                            disabled={locked}
                                        />
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    <Box sx={{ mt: 4, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                        <Alert severity="info">
                            Changes to AI Mode generally apply instantly, but active conversations might finish their session with the previous model.
                        </Alert>
                    </Box>
                </CustomTabPanel>

                {/* --- Tab 3: API Keys --- */}
                <CustomTabPanel value={tabValue} index={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h6">Active API Keys</Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateKeyOpen(true)}>Create Key</Button>
                    </Box>

                    <TableContainer component={Card} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Key Prefix</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apiKeys.map((key) => (
                                    <TableRow key={key.id}>
                                        <TableCell sx={{ fontWeight: 'medium' }}>{key.name}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace' }}>{key.prefix}</TableCell>
                                        <TableCell>{hasMounted ? new Date(key.created).toLocaleDateString() : key.created}</TableCell>
                                        <TableCell>
                                            <Chip label={key.status} color={key.status === 'active' ? 'success' : 'default'} size="small" sx={{ textTransform: 'capitalize' }} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteKey(key.id)}
                                                disabled={key.status === 'revoked'}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CustomTabPanel>
            </Paper>

            {/* Create Key Dialog */}
            <Dialog open={createKeyOpen} onClose={() => setCreateKeyOpen(false)}>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Key Name (e.g. Website Production)"
                        fullWidth
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateKeyOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateKey} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Upgrade Plan Dialog */}
            <Dialog open={upgradeDialogOpen} onClose={() => setUpgradeDialogOpen(false)} maxWidth="sm" fullWidth>
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Box sx={{
                        width: 60, height: 60,
                        bgcolor: 'primary.light',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2, color: 'white'
                    }}>
                        <RocketLaunchIcon fontSize="large" />
                    </Box>
                    <Typography variant="h5" gutterBottom fontWeight="bold">Unlock Full AI Potential</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        The <b>Agente Full AI</b> requires the <b>BUSINESS</b> plan. Upgrade now to access advanced reasoning capabilities.
                    </Typography>

                    <Card variant="outlined" sx={{ mb: 4, textAlign: 'left' }}>
                        <Stack spacing={2} sx={{ p: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="body2">Advanced Bedrock + Sonnet Models</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="body2">Full Knowledge Base Integration</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="body2">Sentiment Analysis & Reporting</Typography>
                            </Stack>
                        </Stack>
                    </Card>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            onClick={() => setUpgradeDialogOpen(false)}
                        >
                            Maybe Later
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => {
                                // In a real app, this would redirect to stripe or change subscription
                                setCurrentPlan('BUSINESS'); // Mock Upgrade
                                setUpgradeDialogOpen(false);
                            }}
                        >
                            Upgrade to Business ($49/mo)
                        </Button>
                    </Stack>
                </Box>
            </Dialog>
        </>
    );
}
