/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import Image from 'next/image';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import { useTranslations } from 'next-intl';

interface ProfileData {
    centerName: string;
    profession: string;
    specializations: string[];
    operatingHours: string;
    legalName: string;
    taxId: string;
    phone1: string;
    phone2: string;
    email: string;
    website: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    timezone: string;
    logoUrl?: string; // Base64 data URL for now
}

interface IdentityTabProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setProfile: (profile: any) => void;
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

// Common timezones for LATAM/US/EU
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

export default function IdentityTab({ profile, setProfile, onSave }: IdentityTabProps) {
    const t = useTranslations('settings.identity');

    // Local state to handle form inputs before updating parent state
    const [formData, setFormData] = useState<ProfileData>({
        centerName: '',
        profession: '',
        specializations: [],
        operatingHours: '',
        legalName: '',
        taxId: '',
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

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                ...profile,
                address: { ...prev.address, ...(profile.address || {}) }
            }));
        }
    }, [profile]);

    const handleChange = (field: keyof ProfileData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        setProfile(newData);
    };

    const handleAddressChange = (field: string, value: string) => {
        const newAddress = { ...formData.address, [field]: value };
        const newData = { ...formData, address: newAddress };
        setFormData(newData);
        setProfile(newData);
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('logoUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Box sx={{ maxWidth: '100%' }}>
            <Grid container spacing={4}>
                {/* --- Left Column: General Info --- */}
                {/* --- Left Column: Main Configuration --- */}
                <Grid item xs={12} md={8}>
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
                                    placeholder="Ej: Centro de Salud Lucía / Clínica Dental Acme"
                                    required
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
                            IA Context (Identidad Escuchada)
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

                    {/* 5. LEGAL & BILLING */}
                    <Box sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon fontSize="small" /> {t('legal')}
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('legalName')}
                                    value={formData.legalName}
                                    onChange={(e) => handleChange('legalName', e.target.value)}
                                    placeholder="Para fines de facturación"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('taxId')}
                                    value={formData.taxId}
                                    onChange={(e) => handleChange('taxId', e.target.value)}
                                    placeholder="RUT / RFC / CNPJ / CUIT"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Tooltip title={t('taxIdTooltip')}>
                                                    <InfoIcon color="action" fontSize="small" />
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                    }}
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            {formData.logoUrl ? (
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
                <Button variant="contained" onClick={onSave} size="large">
                    {t('save')}
                </Button>
            </Box>
        </Box>
    );
}
