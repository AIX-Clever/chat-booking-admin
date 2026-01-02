
'use client';

import { useTranslations } from 'next-intl';

import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress, Grid, Paper } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { signIn } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { REGISTER_TENANT } from '../../graphql/queries';

const client = generateClient();

export default function RegisterPage() {
    const t = useTranslations('auth.register');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Call Register Mutation
            console.log('Registering tenant...');
            const response = await client.graphql({
                query: REGISTER_TENANT,
                variables: {
                    input: {
                        email,
                        password,
                        companyName: companyName || undefined
                    }
                },
                authMode: 'apiKey'
            });

            console.log('Registration success:', response);

            // 2. Auto Login (using Amplify Auth)
            console.log('Logging in...');
            const { isSignedIn, nextStep } = await signIn({ username: email, password });

            if (isSignedIn) {
                router.push('/onboarding');
            } else {
                // Handle unexpected auth state
                console.log('Sign in state:', nextStep);
                router.push('/login');
            }

        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Registration failed:', err);
            // Parse error message
            const msg = err.message || JSON.stringify(err);
            setError(msg.includes('User with this email already exists')
                ? t('errorAccountExists')
                : t('errorRegistrationFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container component="main" sx={{ height: '100vh' }}>
            {/* Left Side - Value Prop (Netflix Style) */}
            <Grid
                item
                xs={false}
                sm={4}
                md={7}
                sx={{
                    backgroundImage: 'url(https://source.unsplash.com/random?office)',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: (t) =>
                        t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    p: 4
                }}
            >
                <Box sx={{ backgroundColor: 'rgba(0,0,0,0.6)', p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                        {t('heroTitle')}
                    </Typography>
                    <Typography variant="h5">
                        {t('heroSubtitle')}
                    </Typography>
                </Box>
            </Grid>

            {/* Right Side - Registration Form */}
            <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                    sx={{
                        my: 8,
                        mx: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        maxWidth: '450px',
                        margin: 'auto'
                    }}
                >
                    <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                        {t('getStarted')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {t('noCreditCard')}
                    </Typography>

                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                    <Box component="form" noValidate onSubmit={handleRegister} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label={t('email')}
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="companyName"
                            label={t('companyName')}
                            name="companyName"
                            autoComplete="organization"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label={t('password')}
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem' }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('createAccount')}
                        </Button>
                        <Grid container justifyContent="center">
                            <Grid item>
                                <Button href="/login" variant="text">
                                    {t('alreadyHaveAccount')} {t('signIn')}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}
