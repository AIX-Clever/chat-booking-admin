/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import Image from 'next/image';
import BusinessIcon from '@mui/icons-material/Business';
import { useTranslations } from 'next-intl';
import { BusinessProfile } from '../../../types/settings';
import { GENERATE_PRESIGNED_URL } from '../../../graphql/queries';
import { resizeImage } from '../../../utils/image';

interface IdentityTabProps {
    profile: BusinessProfile | null;
    setProfile: (profile: BusinessProfile) => void;
    slug: string;
    setSlug: (slug: string) => void;
    onSave: () => void;
}

const COUNTRIES = [
    { code: 'CL', label: 'Chile' },
    { code: 'MX', label: 'México' },
    { code: 'AR', label: 'Argentina' },
    { code: 'CO', label: 'Colombia' },
    { code: 'PE', label: 'Perú' },
    { code: 'BR', label: 'Brasil' },
    { code: 'US', label: 'United States' },
    { code: 'ES', label: 'España' },
];

const TIMEZONES = [
    { value: 'America/Santiago', label: 'Santiago (Chile)' },
    { value: 'America/Mexico_City', label: 'Ciudad de México' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires' },
    { value: 'America/Bogota', label: 'Bogotá' },
    { value: 'America/Lima', label: 'Lima' },
    { value: 'America/Sao_Paulo', label: 'São Paulo' },
    { value: 'America/New_York', label: 'New York (ET)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
    { value: 'Europe/Madrid', label: 'Madrid' },
    { value: 'UTC', label: 'UTC' },
];

export default function IdentityTab({ profile, setProfile, slug, setSlug, onSave }: IdentityTabProps) {
    const t = useTranslations('settings.identity');
    const client = React.useMemo(() => generateClient(), []);
    const [isUploading, setIsUploading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const publicLink = `https://agendar.holalucia.cl/${slug || 'tu-slug'}`;

    const handleCopyLink = () => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(publicLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const [formData, setFormData] = useState<BusinessProfile>({
        // ... (initial state)
        centerName: '',
        bio: '',
        profession: '',
        specializations: [],
        operatingHours: '',
        phone1: '',
        phone2: '',
        email: '',
        website: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'CL',
        },
        timezone: 'America/Santiago',
    });

    // ... (useEffect)
    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    const handleChange = (field: keyof BusinessProfile, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        setProfile(newData);
    };

    const handleAddressChange = (field: keyof BusinessProfile['address'], value: string) => {
        const newAddress = { ...formData.address, [field]: value };
        const newData = { ...formData, address: newAddress };
        setFormData(newData);
        setProfile(newData);
    };


    const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // 0. Resize Image (Client-Side Optimization)
            const resizedBlob = await resizeImage(file, 500, 500, 0.9);
            const resizedFile = new File([resizedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });

            // 1. Get Presigned URL
            const fileName = resizedFile.name;
            const contentType = resizedFile.type;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GENERATE_PRESIGNED_URL,
                variables: {
                    fileName,
                    contentType
                },
                authMode: 'userPool'
            });

            const uploadUrl = response.data.generatePresignedUrl;

            // 2. Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: resizedFile, // uploading the resized file
                headers: {
                    'Content-Type': contentType
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload image');
            }

            // 3. Construct Public URL
            // We parse the Presigned URL to get the S3 hostname dynamically (works for Dev & Prod)
            const urlObj = new URL(uploadUrl);
            const s3Hostname = urlObj.hostname; // e.g., chat-booking-assets-dev-xxx.s3.amazonaws.com

            const cfDomain = process.env.NEXT_PUBLIC_ASSETS_CDN_DOMAIN || 'd3seqwcdtjbt7o.cloudfront.net';

            // Replace S3 hostname with CloudFront domain and remove query params
            const publicUrl = uploadUrl.replace(s3Hostname, cfDomain).split('?')[0];

            // 4. Update State
            handleChange('logoUrl', publicUrl);

        } catch (error) {
            console.error('Error uploading logo:', error);
            alert("Error uploading image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: '100%' }}>
            {/* ... (rest of the component) */}
            <Grid container spacing={4}>
                {/* --- Left Column: General Info --- */}
                {/* --- Left Column: Main Configuration --- */}
                <Grid item xs={12} md={8}>
                    {/* ... (fields) */}
                    {/* 0. PUBLIC PAGE SECTION */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            Link Público (Slug)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Esta es la URL web que tus clientes verán al visitar tu página de reservas alojada.
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12}>
                                <TextField
                                    label="URL de Perfil (Slug)"
                                    value={slug}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, '-')
                                            .replace(/[^a-z0-9-]/g, '');
                                        setSlug(val);
                                    }}
                                    helperText={`Tu página estará en: ${publicLink}`}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: <Typography color="text.secondary" sx={{ mr: 1, pt: 0.2 }}>agendar.holalucia.cl/</Typography>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCopyLink}
                                        size="small"
                                    >
                                        {copySuccess ? 'Copiado!' : 'Copiar Enlace'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        href={publicLink}
                                        target="_blank"
                                        size="small"
                                        disabled={!slug}
                                    >
                                        Ver Página
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 1. BRANDING & BASIC INFO */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BusinessIcon fontSize="small" /> {t('branding')}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('centerName')}
                                    value={formData.centerName}
                                    onChange={(e) => handleChange('centerName', e.target.value)}
                                    placeholder={t('centerNamePlaceholder')}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label={t('bio')}
                                    value={formData.bio}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    placeholder={t('bioPlaceholder')}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 2. CONTACT INFO */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            {t('contact')}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('phone1')}
                                    value={formData.phone1}
                                    onChange={(e) => handleChange('phone1', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('phone2')}
                                    value={formData.phone2}
                                    onChange={(e) => handleChange('phone2', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('email')}
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('website')}
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    placeholder="https://..."
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 3. LOCATION & TIMEZONE */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            {t('location')}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('address')}
                                    value={formData.address.street}
                                    onChange={(e) => handleAddressChange('street', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth select
                                    label={t('country')}
                                    value={formData.address.country}
                                    onChange={(e) => handleAddressChange('country', e.target.value)}
                                >
                                    {COUNTRIES.map((option) => (
                                        <MenuItem key={option.code} value={option.code}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('regionState')}
                                    value={formData.address.state}
                                    onChange={(e) => handleAddressChange('state', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label={t('city')}
                                    value={formData.address.city}
                                    onChange={(e) => handleAddressChange('city', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth select
                                    label={t('timezone')}
                                    value={formData.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                    helperText={t('timezoneHelper')}
                                >
                                    {TIMEZONES.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('operatingHours')}
                                    value={formData.operatingHours}
                                    onChange={(e) => handleChange('operatingHours', e.target.value)}
                                    placeholder="Ej: Lunes a Viernes 09:00 - 19:00"
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {/* 4. AI CONTEXT */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom color="primary.main">
                            {t('aiContext')}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('profession')}
                                    value={formData.profession}
                                    onChange={(e) => handleChange('profession', e.target.value)}
                                    placeholder="Ej: Salud y Bienestar / Asesoría Legal"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('specializations')}
                                    value={formData.specializations ? formData.specializations.join(', ') : ''}
                                    onChange={(e) => handleChange('specializations', e.target.value.split(',').map(s => s.trim()))}
                                    placeholder="Ej: Ortodoncia, Implantología / Derecho Civil, Laboral"
                                    helperText={t('specializationsHelper')}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                {/* --- Right Column: Logo & Branding --- */}
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        p: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                        bgcolor: 'background.paper'
                    }}>
                        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                            {t('logoLabel')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('logoDescription')}
                        </Typography>

                        <Box sx={{
                            width: 120,
                            height: 120,
                            mx: 'auto',
                            mb: 3,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            bgcolor: 'action.hover',
                            display: 'flex',
                            position: 'relative',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            {isUploading ? (
                                <CircularProgress />
                            ) : formData.logoUrl ? (
                                <Image
                                    src={formData.logoUrl}
                                    alt="Logo"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            ) : (
                                <BusinessIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
                            )}
                        </Box>

                        <Button
                            component="label"
                            variant="outlined"
                            fullWidth
                            disabled={isUploading}
                        >
                            {t('uploadButton')}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                        </Button>
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.disabled' }}>
                            {t('uploadRecommended')}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Button
                    variant="contained"
                    onClick={onSave}
                    size="large"
                    disabled={isUploading}
                    startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isUploading ? 'Subiendo Imagen...' : t('save')}
                </Button>
            </Box>
        </Box>
    );
}
