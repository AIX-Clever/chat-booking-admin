
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Stepper, Step, StepLabel, Button, Typography,
    Container, Paper, TextField, CircularProgress, Alert,
    Card, CardContent
} from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { UPDATE_TENANT, CREATE_SERVICE } from '../../graphql/queries';

const client = generateClient();

const steps = ['Brand Your Chat', 'Add First Service', 'Launch'];

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

    useEffect(() => {
        // Load initial data
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
                    }
                });
            } else if (activeStep === 1) {
                // Create Service
                await client.graphql({
                    query: CREATE_SERVICE,
                    variables: {
                        input: {
                            name: serviceName,
                            category: 'General',
                            durationMinutes: parseInt(duration),
                            price: parseFloat(price)
                        }
                    }
                });
            }

            setActiveStep((prev) => prev + 1);
        } catch (err: any) {
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
        router.push('/dashboard');
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
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                        />
                                        <TextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            id="price"
                                            label="Price ($)"
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </Box>
                                </Box>
                            )}

                            {activeStep === 2 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="h6" gutterBottom>Launch your Widget</Typography>
                                    <Typography variant="body1" paragraph>
                                        Copy and paste this code into your website's <code>&lt;head&gt;</code> tag:
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
