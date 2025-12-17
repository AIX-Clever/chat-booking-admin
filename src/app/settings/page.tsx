'use client';

import * as React from 'react';
import {
    Typography,
    Box,
    Paper,
    Tabs,
    Tab,
    CircularProgress,
    Alert,
    Snackbar,
    Button
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';

import { generateClient } from 'aws-amplify/api';
import { UPDATE_TENANT, GET_TENANT } from '../../graphql/queries';

// Import refactored components
import PropertiesTab from './tabs/PropertiesTab';
import AiConfigTab from './tabs/AiConfigTab';
import ApiKeysTab from './tabs/ApiKeysTab';

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

export default function SettingsPage() {
    const client = generateClient();
    const [tabValue, setTabValue] = React.useState(0);
    const [hasMounted, setHasMounted] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    // Tenant State
    const [tenantId, setTenantId] = React.useState<string>('');
    const [currentPlan, setCurrentPlan] = React.useState('PRO'); // Default fallback

    // Widget State
    const [widgetConfig, setWidgetConfig] = React.useState({
        primaryColor: '#2563eb',
        position: 'bottom-right',
        language: 'es',
        welcomeMessage: '¡Hola! ¿En qué puedo ayudarte hoy?'
    });

    // AI State
    const [aiMode, setAiMode] = React.useState('nlp');

    React.useEffect(() => {
        setHasMounted(true);
        fetchTenantData();
    }, []);

    const fetchTenantData = async () => {
        setLoading(true);
        try {
            // Retrieving tenantId from local storage if available, but it's optional now
            const storedTenantId = localStorage.getItem('tenantId');
            if (storedTenantId) {
                setTenantId(storedTenantId);
            }

            // Always call GET_TENANT. If tenantId is not provided, backend infers from auth context.
            const response = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: storedTenantId || null }
            }) as any;

            const tenant = response.data.getTenant;
            if (tenant) {
                if (tenant.tenantId) setTenantId(tenant.tenantId);
                if (tenant.plan) setCurrentPlan(tenant.plan);
                if (tenant.settings) {
                    try {
                        const settings = JSON.parse(tenant.settings);

                        // Compatibility with Onboarding data structure
                        if (settings.theme && settings.theme.primaryColor && !settings.widgetConfig) {
                            setWidgetConfig(prev => ({
                                ...prev,
                                primaryColor: settings.theme.primaryColor
                            }));
                        }

                        if (settings.widgetConfig) setWidgetConfig(settings.widgetConfig);
                        if (settings.aiMode) setAiMode(settings.aiMode);
                    } catch (e) {
                        console.warn("Failed to parse tenant settings JSON", e);
                    }
                }
            } else {
                // Should not happen if backend throws on not found, but handle empty
                console.warn("No tenant data returned");
            }

        } catch (err: any) {
            console.error('Error fetching tenant data:', err);
            // Don't block UI on error, just log it. Data will be defaults.
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            const settingsJson = JSON.stringify({
                widgetConfig,
                aiMode
            });

            await client.graphql({
                query: UPDATE_TENANT,
                variables: {
                    input: {
                        name: undefined, // Don't update name
                        billingEmail: undefined,
                        settings: settingsJson
                    }
                }
            });
            setSuccessMsg('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving branding:', error);
            setError('Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!hasMounted) return null;

    return (
        <>
            <Typography variant="h4" sx={{ mb: 4 }}>Settings</Typography>

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
            </Snackbar>

            <Snackbar
                open={!!successMsg}
                autoHideDuration={6000}
                onClose={() => setSuccessMsg(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccessMsg(null)}>{successMsg}</Alert>
            </Snackbar>

            <Paper sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleChangeTab} aria-label="settings tabs">
                        <Tab label="Widget & Branding" icon={<ChatIcon />} iconPosition="start" />
                        <Tab label="AI Configuration" icon={<AutoAwesomeIcon />} iconPosition="start" />
                        <Tab label="API Keys" icon={<VpnKeyIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                {loading && !widgetConfig ? (
                    <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* --- Tab 1: Widget & Branding --- */}
                        <CustomTabPanel value={tabValue} index={0}>
                            <PropertiesTab
                                widgetConfig={widgetConfig}
                                setWidgetConfig={setWidgetConfig}
                                onSave={handleSaveSettings}
                            />
                        </CustomTabPanel>

                        {/* --- Tab 2: AI Configuration --- */}
                        <CustomTabPanel value={tabValue} index={1}>
                            <AiConfigTab
                                aiMode={aiMode}
                                setAiMode={(mode) => {
                                    setAiMode(mode);
                                    // Make it feel instant, but we might want to verify user intent to save immediately or explicitly
                                    // Previous code had specific save button for branding but logic for AI mode was immediate?
                                    // Let's rely on explicit save for better UX or auto-save.
                                    // To keep consistency with PropertiesTab, let's add a save button inside AiConfigTab or save immediately.
                                    // The previous impl had no save button in AI tab, implying auto-save or mock.
                                    // We'll stick to local state change, user can navigate back to Tab 1 to save? 
                                    // UX Decision: Adding auto-save for AI mode or shared save button? 
                                    // Let's simply trigger save when mode changes? No, unsafe. 
                                    // Let's add a Save button to the page or handle it inside tab.
                                    // For now, we update local state.
                                }}
                                currentPlan={currentPlan}
                                onUpgradeClick={() => {
                                    // Mock upgrade implementation
                                    alert("Contact sales to upgrade!");
                                }}
                            />
                            <Box sx={{ mt: 2 }}>
                                <Button variant="contained" startIcon={<React.Fragment><Typography variant="button" sx={{ mr: 1 }}>💾</Typography></React.Fragment>} onClick={handleSaveSettings}>
                                    Save AI Settings
                                </Button>
                            </Box>
                        </CustomTabPanel>

                        {/* --- Tab 3: API Keys --- */}
                        <CustomTabPanel value={tabValue} index={2}>
                            <ApiKeysTab hasMounted={hasMounted} />
                        </CustomTabPanel>
                    </>
                )}

            </Paper>
        </>
    );
}
