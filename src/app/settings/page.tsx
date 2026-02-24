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
import BusinessIcon from '@mui/icons-material/Business';
import { useSearchParams } from 'next/navigation';
import CreditCardIcon from '@mui/icons-material/CreditCard';


import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { UPDATE_TENANT, GET_TENANT } from '../../graphql/queries';
import { useTenant } from '../../context/TenantContext';

// Import refactored components
import AiConfigTab from './tabs/AiConfigTab';
import ApiKeysTab from './tabs/ApiKeysTab';
import IdentityTab from './tabs/IdentityTab';
import ComplianceTab from './tabs/ComplianceTab';
import BillingTab from './tabs/BillingTab';
import { WidgetConfig } from '../../types/settings';



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

function SettingsContent() {
    const t = useTranslations('settings');
    const searchParams = useSearchParams();
    const client = React.useMemo(() => generateClient(), []);
    const { refreshTenant } = useTenant();

    // Initial tab logic
    const getInitialTab = React.useCallback(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'identity' || tabParam === 'profile') return 0;
        if (tabParam === 'ai') return 1;
        if (tabParam === 'compliance' || tabParam === 'legal') return 2;
        if (tabParam === 'billing' || tabParam === 'plan') return 3;
        if (tabParam === 'keys' || tabParam === 'api') return 4;
        return 0;

    }, [searchParams]);

    const [tabValue, setTabValue] = React.useState(0);

    React.useEffect(() => {
        setTabValue(getInitialTab());
    }, [searchParams, getInitialTab]);
    const [hasMounted, setHasMounted] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    // Tenant State
    const [currentPlan, setCurrentPlan] = React.useState('PRO');

    // Widget State
    const [widgetConfig, setWidgetConfig] = React.useState<WidgetConfig>({
        primaryColor: '#2563eb',
        position: 'bottom-right',
        language: 'es',
        welcomeMessages: {
            es: '¡Hola! ¿En qué puedo ayudarte hoy?',
            en: 'Hello! How can I help you today?',
            pt: 'Olá! Como posso ayudar você hoje?'
        }
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

                        // Compatibility with Onboarding data structure
                        if (settings.theme && settings.theme.primaryColor && !settings.widgetConfig) {
                            setWidgetConfig(prev => ({
                                ...prev,
                                ...settings.widgetConfig,
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
                        }
                    } catch (e) {
                        console.warn("Failed to parse tenant settings JSON", e);
                    }
                }
            } else {
                console.warn("No tenant data returned");
            }

        } catch (err: unknown) {
            console.error('Error fetching tenant data:', err);
        } finally {
            setLoading(false);
        }
    }, [client]);

    React.useEffect(() => {
        setHasMounted(true);
        fetchTenantData();
    }, [fetchTenantData]);

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            setError(null);

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
            await refreshTenant();

            // Settings saved successfully - stop loading
            setLoading(false);
        } catch (error: any) {
            console.error('Error saving settings:', error);
            // Extract message from GraphQL error
            const apiMessage = error.errors?.[0]?.message || error.message;
            if (apiMessage && (apiMessage.includes('link personalizado') || apiMessage.includes('slug'))) {
                setError(apiMessage);
            } else {
                setError(t('saveError'));
            }
            setLoading(false);
        }
    };

    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!hasMounted) return null;

    const showApiKeys = currentPlan !== 'LITE';

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
                    <Tabs value={tabValue} onChange={handleChangeTab} aria-label="settings tabs" scrollButtons="auto" variant="scrollable">
                        <Tab label={t('tabs.identity')} icon={<BusinessIcon />} iconPosition="start" />
                        <Tab label={t('tabs.ai')} icon={<AutoAwesomeIcon />} iconPosition="start" />
                        <Tab label={t('tabs.compliance')} icon={<Box component="span" sx={{ fontSize: '1.2rem' }}>⚖️</Box>} iconPosition="start" />
                        <Tab label="Facturación" icon={<CreditCardIcon />} iconPosition="start" />
                        {showApiKeys && (
                            <Tab label={t('tabs.apiKeys')} icon={<VpnKeyIcon />} iconPosition="start" />
                        )}
                    </Tabs>
                </Box>

                {loading && !profile ? (
                    <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {/* --- Tab 0: Identity (Profile) --- */}
                        <CustomTabPanel value={tabValue} index={0}>
                            <IdentityTab profile={profile} setProfile={setProfile} slug={slug} setSlug={setSlug} onSave={handleSaveSettings} />
                        </CustomTabPanel>

                        {/* --- Tab 1: AI Configuration (Intelligence) --- */}
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

                        {/* --- Tab 2: Compliance (Legal) --- */}
                        <CustomTabPanel value={tabValue} index={2}>
                            <ComplianceTab profile={profile} setProfile={setProfile} onSave={handleSaveSettings} />
                        </CustomTabPanel>

                        {/* --- Tab 3: Billing --- */}
                        <CustomTabPanel value={tabValue} index={3}>
                            <BillingTab />
                        </CustomTabPanel>

                        {/* --- Tab 4: API Keys (Conditional) --- */}
                        {showApiKeys && (
                            <CustomTabPanel value={tabValue} index={4}>
                                <ApiKeysTab />
                            </CustomTabPanel>
                        )}

                    </>
                )}

            </Paper>
        </>
    );
}

export default function SettingsPage() {
    return (
        <React.Suspense fallback={
            <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        }>
            <SettingsContent />
        </React.Suspense>
    );
}
