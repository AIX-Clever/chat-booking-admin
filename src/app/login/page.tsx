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

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [formData, setFormData] = React.useState({
        email: '',
        password: ''
    });


    React.useEffect(() => {
        // Check for error params from redirection
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.get('error') === 'no_tenant') {
            setError('Tu cuenta no está asociada a ningún tenant. Contacta a soporte.');
        }
    }, []);

    const handleChange = (prop: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [prop]: event.target.value });
        setError('');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { isSignedIn, nextStep } = await signIn({
                username: formData.email,
                password: formData.password,
            });

            if (isSignedIn) {
                router.push('/dashboard');
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
                        Gestiona tus Reservas con IA
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.8, mb: 4, fontWeight: 'normal' }}>
                        Automatiza citas, gestiona proveedores y ofrece un servicio excepcional.
                    </Typography>
                </Box>
            </Box>

            {/* Right Side - Login Form */}
            <Box
                sx={{
                    flex: { xs: 1, md: 0.8 }, // Give form slightly less width on large screens
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
                            Bienvenido de nuevo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ingresa tus credenciales para acceder al panel.
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleLogin}>
                        <Stack spacing={3}>
                            <TextField
                                fullWidth
                                label="Correo Electrónico"
                                placeholder="admin@lucia.com"
                                value={formData.email}
                                onChange={handleChange('email')}
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
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange('password')}
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
                                <Link component="button" variant="body2" underline="hover" onClick={() => { }}>
                                    ¿Olvidaste tu contraseña?
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
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
                            </Button>
                        </Stack>
                    </form>

                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            ¿No tienes una cuenta?{' '}
                            <Link href="#" underline="hover" fontWeight="medium">
                                Contactar Soporte
                            </Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
}
