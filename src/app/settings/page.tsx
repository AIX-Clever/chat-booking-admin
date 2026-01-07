/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
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
import BusinessIcon from '@mui/icons-material/Business';
import { useSearchParams } from 'next/navigation';

import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { UPDATE_TENANT, GET_TENANT } from '../../graphql/queries';

// Import refactored components
import PropertiesTab from './tabs/PropertiesTab';
import AiConfigTab from './tabs/AiConfigTab';
import ApiKeysTab from './tabs/ApiKeysTab';
import IdentityTab from './tabs/IdentityTab';

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
    const t = useTranslations('settings');
    const searchParams = useSearchParams();
    const client = React.useMemo(() => generateClient(), []);

    // Initial tab logic
    const getInitialTab = () => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'ai') return 1;
        if (tabParam === 'keys') return 2;
        if (tabParam === 'identity') return 3;
        return 0;
    };

    const [tabValue, setTabValue] = React.useState(getInitialTab);
    const [hasMounted, setHasMounted] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    // Tenant State
    // const [tenantId, setTenantId] = React.useState<string>(''); // Removed unused state
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
    const [ragEnabled, setRagEnabled] = React.useState(false);

    // Profile State
    const [profile, setProfile] = React.useState<any>(null);

    const fetchTenantData = React.useCallback(async () => {
        setLoading(true);
        try {
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            // Always call GET_TENANT. If tenantId is not provided, backend infers from auth context.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: null }, // Backend infers from token
                authToken: token
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as { data: { getTenant: any } };

            const tenant = response.data.getTenant;
            if (tenant) {
                // if (tenant.tenantId) setTenantId(tenant.tenantId);
                if (tenant.plan) setCurrentPlan(tenant.plan);
                if (tenant.settings) {
                    try {
                        let settings = tenant.settings;

                        // Robust parsing: Handle double-serialization or single-serialization
                        if (typeof settings === 'string') {
                            try {
                                settings = JSON.parse(settings);
                            } catch (e) {
                                console.error("First parse failed", e);
                            }
                        }
                        // Check if it's STILL a string (double encoded)
                        if (typeof settings === 'string') {
                            try {
                                settings = JSON.parse(settings);
                            } catch (e) {
                                console.error("Second parse failed", e);
                            }
                        }

                        console.log("Final Parsed Settings:", settings);

                        // Compatibility with Onboarding data structure
                        if (settings.theme && settings.theme.primaryColor && !settings.widgetConfig) {
                            setWidgetConfig(prev => ({
                                ...prev,
                                primaryColor: settings.theme.primaryColor
                            }));
                        }

                        if (settings.widgetConfig) {
                            const config = settings.widgetConfig;
                            // Migrate legacy welcomeMessage to welcomeMessages map if needed
                            if (!config.welcomeMessages && config.welcomeMessage) {
                                config.welcomeMessages = {
                                    es: config.welcomeMessage,
                                    en: 'Hello! How can I help you today?',
                                    pt: 'Olá! Como posso ajudar você hoje?'
                                };
                            }
                            // Ensure welcomeMessages exists even if empty
                            if (!config.welcomeMessages) {
                                config.welcomeMessages = {
                                    es: '¡Hola! ¿En qué puedo ayudarte hoy?',
                                    en: 'Hello! How can I help you today?',
                                    pt: 'Olá! Como posso ajudar você hoje?'
                                };
                            }
                            setWidgetConfig(config);
                        }
                        if (settings.aiMode) setAiMode(settings.aiMode);
                        if (settings.ai && typeof settings.ai.enabled !== 'undefined') {
                            setRagEnabled(settings.ai.enabled);
                        }
                        if (settings.profile) {
                            setProfile(settings.profile);
                        } else {
                            // console.warn("Profile missing in settings object:", settings);
                        }
                    } catch (e) {
                        console.warn("Failed to parse tenant settings JSON", e);
                    }
                }
            } else {
                // Should not happen if backend throws on not found, but handle empty
                console.warn("No tenant data returned");
            }

        } catch (err: unknown) {
            console.error('Error fetching tenant data:', err);
            // Don't block UI on error, just log it. Data will be defaults.
        } finally {
            setLoading(false);
        }
    }, [client]); // Empty dependencies - client is stable from generateClient()

    React.useEffect(() => {
        setHasMounted(true);
        fetchTenantData();
    }, [fetchTenantData]);

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            const settingsObj = {
                widgetConfig,
                aiMode,
                ai: {
                    enabled: ragEnabled
                },
                profile
            };
            const settingsJson = JSON.stringify(settingsObj);

            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            await client.graphql({
                query: UPDATE_TENANT,
                variables: {
                    input: {
                        name: undefined, // Don't update name
                        billingEmail: undefined,
                        settings: settingsJson
                    }
                },
                authToken: token
            });
            setSuccessMsg(t('saveSuccess'));

            // Refresh tenant context so other pages see the updated settings
            const { refreshTenant } = await import('../../context/TenantContext');
            if (refreshTenant) {
                // Give backend a moment to propagate
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (error) {
            console.error('Error saving branding:', error);
            setError(t('saveError'));
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
            <Typography variant="h4" sx={{ mb: 4 }}>{t('title')}</Typography>

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
                        <Tab label={t('tabs.general')} icon={<ChatIcon />} iconPosition="start" />
                        <Tab label={t('tabs.ai')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                        <Tab label={t('tabs.apiKeys')} icon={<VpnKeyIcon />} iconPosition="start" />
                        <Tab label={t('tabs.identity')} icon={<BusinessIcon />} iconPosition="start" />
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
                                }}
                                ragEnabled={ragEnabled}
                                setRagEnabled={setRagEnabled}
                                currentPlan={currentPlan}
                                onUpgradeClick={() => {
                                    // Mock upgrade implementation
                                    alert(t('upgradeAlert'));
                                }}
                            />
                            <Box sx={{ mt: 2 }}>
                                <Button variant="contained" startIcon={<React.Fragment><Typography variant="button" sx={{ mr: 1 }}>💾</Typography></React.Fragment>} onClick={handleSaveSettings}>
                                    {t('ai.saveAiSettings')}
                                </Button>
                            </Box>
                        </CustomTabPanel>

                        {/* --- Tab 3: API Keys --- */}
                        <CustomTabPanel value={tabValue} index={2}>
                            <ApiKeysTab hasMounted={hasMounted} />
                        </CustomTabPanel>

                        {/* --- Tab 4: Identity --- */}
                        <CustomTabPanel value={tabValue} index={3}>
                            <IdentityTab profile={profile} setProfile={setProfile} onSave={handleSaveSettings} />
                        </CustomTabPanel>
                    </>
                )}

            </Paper>
        </>
    );
}
