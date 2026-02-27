
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Stepper, Step, StepLabel, Button, Typography,
    Container, Paper, TextField, CircularProgress, Alert,
    Card, CardContent,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Divider
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { UPDATE_TENANT, CREATE_SERVICE } from '../../graphql/queries';

const client = generateClient();

const steps = ['Brand Your Chat', 'Billing Preferences', 'Add First Service', 'Launch'];

export default function OnboardingPage() {
    const router = useRouter();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tenantId, setTenantId] = useState<string | null>(null);

    // Branding State
    const [companyName, setCompanyName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#2563EB'); // Blue default

    // Service State
    const [serviceName, setServiceName] = useState('Consultation');
    const [duration, setDuration] = useState('30');
    const [price, setPrice] = useState('0');

    // Billing State
    const [billingType, setBillingType] = useState<'33' | '39'>('39');
    const [billingData, setBillingData] = useState({
        rut: '',
        name: '',
        giro: '',
        address: '',
        comuna: '',
        email: ''
    });

    useEffect(() => {
        // LEGACY ONBOARDING CLEANUP: Redirect to the dedicated onboarding app
        const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL || 'https://onboarding.holalucia.cl';
        const plan = typeof window !== 'undefined' ? localStorage.getItem('onboarding_plan') : null;

        console.log('[LEGACY_ONBOARDING] Redirecting to dedicated onboarding app...');
        window.location.href = `${onboardingUrl}${plan ? `?plan=${plan}` : ''}`;
    }, []);

    useEffect(() => {
        // Load initial data (keeping for reference but normally unreachable)
        const loadUser = async () => {
            try {
                const attrs = await fetchUserAttributes();
                const tid = attrs['custom:tenantId'];
                if (tid) setTenantId(tid);
                // Also could fetch current tenant name here if needed
            } catch (e) {
                console.error("Failed to load user", e);
            }
        };
        loadUser();
    }, []);

    const handleNext = async () => {
        setLoading(true);
        setError(null);
        try {
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (activeStep === 0) {
                // Save Branding
                await client.graphql({
                    query: UPDATE_TENANT,
                    variables: {
                        input: {
                            name: companyName, // Update name if changed
                            settings: JSON.stringify({
                                theme: {
                                    primaryColor: primaryColor
                                }
                            })
                        }
                    },
                    authToken: token
                });
            } else if (activeStep === 1) {
                // Save Billing Preferences
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const settingsUpdate: any = {
                    billing: {
                        tipoDte: billingType,
                        ...(billingType === '33' ? billingData : {})
                    }
                };

                // Merge with existing branding if we want to be safe, 
                // but in onboarding we usually build it step by step.
                await client.graphql({
                    query: UPDATE_TENANT,
                    variables: {
                        input: {
                            settings: JSON.stringify({
                                theme: { primaryColor },
                                billing: settingsUpdate.billing
                            })
                        }
                    },
                    authToken: token
                });
            } else if (activeStep === 2) {
                // Create Service (Now Step 2 instead of 1)
                await client.graphql({
                    query: CREATE_SERVICE,
                    variables: {
                        input: {
                            name: serviceName,
                            category: 'General',
                            durationMinutes: parseInt(duration) || 0,
                            price: parseFloat(price) || 0
                        }
                    },
                    authToken: token
                });
            }

            setActiveStep((prev) => prev + 1);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Step failed:', err);
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    const handleFinish = () => {
        router.push('/bookings');
    };

    return (
        <Container component="main" maxWidth="md" sx={{ mb: 4 }}>
            <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    Welcome to ChatBooking
                </Typography>

                <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {activeStep === steps.length ? (
                    <React.Fragment>
                        <Typography variant="h5" gutterBottom>
                            All set!
                        </Typography>
                        <Typography variant="subtitle1">
                            Your chat booking widget is ready to deploy.
                        </Typography>
                        <Button onClick={handleFinish} sx={{ mt: 3, ml: 1 }}>
                            Go to Dashboard
                        </Button>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <Box sx={{ minHeight: '200px' }}>
                            {activeStep === 0 && (
                                <Box component="form" noValidate sx={{ mt: 1 }}>
                                    <Typography variant="h6" gutterBottom>Customize your Brand</Typography>
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        id="companyName"
                                        label="Company Name"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        helperText="This will simplify how clients see you"
                                    />
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        id="color"
                                        label="Primary Color (Hex)"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        type="color"
                                        sx={{ width: 100 }}
                                    />
                                </Box>
                            )}

                            {activeStep === 1 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="h6" gutterBottom>Billing Preferences</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Choose how you want to receive receipts for your Hola Lucia subscription.
                                    </Typography>

                                    <FormControl component="fieldset">
                                        <FormLabel component="legend">Document Type</FormLabel>
                                        <RadioGroup
                                            row
                                            value={billingType}
                                            onChange={(e) => setBillingType(e.target.value as '33' | '39')}
                                        >
                                            <FormControlLabel value="39" control={<Radio />} label="Boleta" />
                                            <FormControlLabel value="33" control={<Radio />} label="Factura" />
                                        </RadioGroup>
                                    </FormControl>

                                    {billingType === '33' && (
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Divider sx={{ mb: 1 }} />
                                            <Typography variant="subtitle2">Fiscal Data</Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                                <TextField
                                                    label="RUT Empresa"
                                                    value={billingData.rut}
                                                    onChange={(e) => setBillingData({ ...billingData, rut: e.target.value })}
                                                    fullWidth
                                                    placeholder="76.123.456-7"
                                                />
                                                <TextField
                                                    label="Razón Social"
                                                    value={billingData.name}
                                                    onChange={(e) => setBillingData({ ...billingData, name: e.target.value })}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label="Giro"
                                                    value={billingData.giro}
                                                    onChange={(e) => setBillingData({ ...billingData, giro: e.target.value })}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label="Dirección"
                                                    value={billingData.address}
                                                    onChange={(e) => setBillingData({ ...billingData, address: e.target.value })}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label="Comuna"
                                                    value={billingData.comuna}
                                                    onChange={(e) => setBillingData({ ...billingData, comuna: e.target.value })}
                                                    fullWidth
                                                />
                                                <TextField
                                                    label="Email Facturación"
                                                    value={billingData.email}
                                                    onChange={(e) => setBillingData({ ...billingData, email: e.target.value })}
                                                    fullWidth
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {activeStep === 2 && (
                                <Box component="form" noValidate sx={{ mt: 1 }}>
                                    <Typography variant="h6" gutterBottom>Create your first Service</Typography>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="serviceName"
                                        label="Service Name"
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                    />
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="duration"
                                            label="Duration (minutes)"
                                            type="number"
                                            placeholder="30"
                                            value={duration === '0' ? '' : duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="price"
                                            label="Price ($)"
                                            type="number"
                                            placeholder="0"
                                            value={price === '0' ? '' : price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </Box>
                                </Box>
                            )}

                            {activeStep === 3 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="h6" gutterBottom>Launch your Widget</Typography>
                                    <Typography variant="body1" paragraph>
                                        Copy and paste this code into your website&apos;s <code>&lt;head&gt;</code> tag:
                                    </Typography>
                                    <Card variant="outlined" sx={{ bgcolor: 'grey.100', mb: 3 }}>
                                        <CardContent>
                                            <code style={{ wordBreak: 'break-all' }}>
                                                {`<script 
  src="https://cdn.chatbooking.com/widget.js" 
  data-tenant-id="${tenantId || 'YOUR_TENANT_ID'}"
></script>`}
                                            </code>
                                        </CardContent>
                                    </Card>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        href={`https://chatbooking-landing.com?tenantId=${tenantId}`}
                                        target="_blank"
                                    >
                                        Try my Chat Live
                                    </Button>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            {activeStep !== 0 && (
                                <Button onClick={handleBack} sx={{ mt: 3, ml: 1 }}>
                                    Back
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                sx={{ mt: 3, ml: 1 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : (activeStep === steps.length - 1 ? 'Finish' : 'Next')}
                            </Button>
                        </Box>
                    </React.Fragment>
                )}
            </Paper>
        </Container>
    );
}
