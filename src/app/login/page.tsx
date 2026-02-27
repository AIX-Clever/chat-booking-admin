'use client';

import * as React from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Checkbox,
    FormControlLabel,
    Stack,
    Link,
    Alert,
    CircularProgress
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlineIcon from '@mui/icons-material/EmailOutlined';
import LockOutlineIcon from '@mui/icons-material/LockOutlined';
import { signIn } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const router = useRouter();
    const t = useTranslations('auth.login');
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [formData, setFormData] = React.useState({
        email: '',
        password: ''
    });
    const [showNewPassword, setShowNewPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    React.useEffect(() => {
        // Check if user is already signed in
        const checkAuth = async () => {
            try {
                const { getCurrentUser } = await import('aws-amplify/auth');
                await getCurrentUser();
                // If no error, user is signed in, redirect to bookings
                router.push('/bookings');
            } catch {
                // Not signed in, do nothing
                console.log('No active session found');
            }
        };
        checkAuth();

        // Check for error params from redirection
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('error') === 'no_tenant') {
            setError('Tu cuenta no está asociada a ningún tenant. Contacta a soporte.');
        }
    }, [router]);

    const handleChange = (prop: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [prop]: event.target.value });
        setError('');
    };



    const [view, setView] = React.useState<'login' | 'forgot' | 'reset' | 'newPassword'>('login');
    const [resetData, setResetData] = React.useState({
        code: '',
        newPassword: ''
    });
    const [newPasswordData, setNewPasswordData] = React.useState({
        password: '',
        confirmPassword: ''
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { isSignedIn, nextStep } = await signIn({
                username: formData.email,
                password: formData.password,
            });

            if (isSignedIn) {
                router.push('/bookings');
            } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
                setView('newPassword');
                setError('');
            } else {
                console.log('Login incomplete, next step:', nextStep);
                setError(`Login incompleto. Paso requerido: ${nextStep.signInStep}`);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Login error:', err);
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPasswordData.password !== newPasswordData.confirmPassword) {
            setError(t('passwordMismatch'));
            return;
        }
        setLoading(true);
        try {
            const { confirmSignIn } = await import('aws-amplify/auth');
            const { isSignedIn, nextStep } = await confirmSignIn({
                challengeResponse: newPasswordData.password
            });

            if (isSignedIn) {
                router.push('/bookings');
            } else {
                setError(`Login incompleto. Paso requerido: ${nextStep.signInStep}`);
            }
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Complete new password error:', err);
            setError(err.message || 'Error al establecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email) {
            setError('Por favor ingresa tu email');
            return;
        }
        setLoading(true);
        try {
            const { resetPassword } = await import('aws-amplify/auth');
            await resetPassword({ username: formData.email });
            setView('reset');
            setError('');
            // Optional: Success toast could go here
        } catch (err: unknown) {
            console.error('Reset error:', err);
            const message = err instanceof Error ? err.message : 'Error al solicitar el código';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { confirmResetPassword } = await import('aws-amplify/auth');
            await confirmResetPassword({
                username: formData.email,
                confirmationCode: resetData.code,
                newPassword: resetData.newPassword
            });
            setView('login');
            setError('');
            alert(t('passwordChanged'));
        } catch (err: unknown) {
            console.error('Confirm reset error:', err);
            const message = err instanceof Error ? err.message : 'Error al confirmar la nueva contraseña';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const loginUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL || 'https://onboarding.holalucia.cl';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Left Side - Brand/Image */}
            <Box
                sx={{
                    flex: 1,
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: 'white',
                    p: 6,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Abstract Shapes */}
                <Box sx={{
                    position: 'absolute',
                    top: '-20%',
                    left: '-20%',
                    width: '60%',
                    height: '60%',
                    background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                }} />
                <Box sx={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-10%',
                    width: '50%',
                    height: '50%',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                }} />

                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        {t('title')}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8, mb: 4, fontWeight: 'normal' }}>
                        {t('subtitle')}
                    </Typography>
                </Box>
            </Box>

            {/* Right Side - Forms */}
            <Box
                sx={{
                    flex: { xs: 1, md: 0.8 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 4
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: '100%',
                        maxWidth: 420,
                        p: 0,
                        bgcolor: 'transparent'
                    }}
                >
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {view === 'login' ? 'Bienvenido de nuevo' :
                                view === 'forgot' ? t('resetPasswordTitle') :
                                    view === 'newPassword' ? t('newPasswordRequired') :
                                        t('confirmReset')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {view === 'login' ? 'Ingresa tus credenciales para acceder al panel.' :
                                view === 'forgot' ? t('resetPasswordSubtitle') :
                                    view === 'newPassword' ? t('newPasswordSubtitle') :
                                        'Ingresa el código que te enviamos y tu nueva contraseña.'}
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {view === 'login' && (
                        <form onSubmit={handleLogin}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label={t('email')}
                                    placeholder="admin@lucia.com"
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    inputProps={{ 'data-testid': 'email-input' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    label={t('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange('password')}
                                    inputProps={{ 'data-testid': 'password-input' }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <FormControlLabel
                                        control={<Checkbox defaultChecked color="primary" />}
                                        label={<Typography variant="body2">Recordarme</Typography>}
                                    />
                                    <Link component="button" variant="body2" underline="hover" type="button" onClick={() => setView('forgot')}>
                                        {t('forgotPassword')}
                                    </Link>
                                </Box>

                                <Button
                                    fullWidth
                                    size="large"
                                    type="submit"
                                    variant="contained"
                                    disabled={loading}
                                    sx={{
                                        height: 48,
                                        fontSize: '1rem',
                                        textTransform: 'none',
                                        background: 'linear-gradient(to right, #2563eb, #7c3aed)',
                                        boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)',
                                        '&:hover': {
                                            background: 'linear-gradient(to right, #1d4ed8, #6d28d9)',
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('signIn')}
                                </Button>
                            </Stack>
                        </form>
                    )}

                    {view === 'forgot' && (
                        <form onSubmit={handleForgotPassword}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label={t('email')}
                                    value={formData.email}
                                    onChange={handleChange('email')}
                                    placeholder="admin@lucia.com"
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                    sx={{ height: 48, textTransform: 'none' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('sendCode')}
                                </Button>
                                <Button variant="text" onClick={() => setView('login')} sx={{ textTransform: 'none' }}>
                                    {t('backToLogin')}
                                </Button>
                            </Stack>
                        </form>
                    )}

                    {view === 'reset' && (
                        <form onSubmit={handleConfirmReset}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label={t('verificationCode')}
                                    value={resetData.code}
                                    onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                                />
                                <TextField
                                    fullWidth
                                    label={t('newPassword')}
                                    type="password"
                                    value={resetData.newPassword}
                                    onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                    sx={{ height: 48, textTransform: 'none' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('confirmReset')}
                                </Button>
                                <Button variant="text" onClick={() => setView('forgot')} sx={{ textTransform: 'none' }}>
                                    {t('backToLogin')}
                                </Button>
                            </Stack>
                        </form>
                    )}

                    {view === 'newPassword' && (
                        <form onSubmit={handleCompleteNewPassword}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label={t('newPasswordRequired')}
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPasswordData.password}
                                    onChange={(e) => {
                                        setNewPasswordData({ ...newPasswordData, password: e.target.value });
                                        setError('');
                                    }}
                                    error={!!error && error.includes(t('passwordMismatch'))}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    edge="end"
                                                >
                                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    label={t('confirmPassword')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={newPasswordData.confirmPassword}
                                    onChange={(e) => {
                                        setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value });
                                        setError('');
                                    }}
                                    error={
                                        (!!newPasswordData.confirmPassword && newPasswordData.password !== newPasswordData.confirmPassword) ||
                                        (!!error && error.includes(t('passwordMismatch')))
                                    }
                                    helperText={
                                        newPasswordData.confirmPassword && newPasswordData.password !== newPasswordData.confirmPassword
                                            ? t('passwordMismatch')
                                            : ''
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlineIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    fullWidth
                                    variant="contained"
                                    type="submit"
                                    disabled={loading || newPasswordData.password !== newPasswordData.confirmPassword}
                                    sx={{
                                        height: 48,
                                        textTransform: 'none',
                                        background: 'linear-gradient(to right, #10b981, #059669)',
                                        '&:hover': {
                                            background: 'linear-gradient(to right, #059669, #047857)',
                                        }
                                    }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('setPassword')}
                                </Button>
                                <Button variant="text" onClick={() => setView('login')} sx={{ textTransform: 'none' }}>
                                    {t('backToLogin')}
                                </Button>
                            </Stack>
                        </form>
                    )}

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('noAccount')}{' '}
                            <Link href={loginUrl} underline="hover" fontWeight="medium">
                                {t('signUp')}
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
