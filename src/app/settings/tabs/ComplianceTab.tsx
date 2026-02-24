/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Grid,
    Switch,
    FormControlLabel,
    InputAdornment,
    Tooltip,
    Paper,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import GavelIcon from '@mui/icons-material/Gavel';
import ShieldIcon from '@mui/icons-material/Shield';
import CookieIcon from '@mui/icons-material/Cookie';
import { useTranslations } from 'next-intl';

interface ComplianceData {
    legalName: string;
    taxId: string;
    privacyPolicyUrl: string;
    dpoContact: string;
    cookieBannerActive: boolean;
    dataRetentionDays: number;
}

interface ComplianceTabProps {
    profile: any;
    setProfile: (profile: any) => void;
    onSave: () => void;
}

export default function ComplianceTab({ profile, setProfile, onSave }: ComplianceTabProps) {
    const t = useTranslations('settings.compliance');

    const [formData, setFormData] = useState<ComplianceData>({
        legalName: '',
        taxId: '',
        privacyPolicyUrl: '',
        dpoContact: '',
        cookieBannerActive: true,
        dataRetentionDays: 365,
    });

    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                ...profile,
                // Ensure we don't overwrite if they are undefined in profile
                legalName: profile.legalName || prev.legalName,
                taxId: profile.taxId || prev.taxId,
                privacyPolicyUrl: profile.privacyPolicyUrl || prev.privacyPolicyUrl,
                dpoContact: profile.dpoContact || prev.dpoContact,
                cookieBannerActive: typeof profile.cookieBannerActive !== 'undefined' ? profile.cookieBannerActive : prev.cookieBannerActive,
            }));
        }
    }, [profile]);

    const handleChange = (field: keyof ComplianceData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        setProfile({ ...profile, ...newData });
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                {t('title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                {t('subtitle')}
            </Typography>

            <Grid container spacing={4}>
                {/* 1. LEGAL INFO */}
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GavelIcon fontSize="small" /> {t('legalInfo')}
                        </Typography>
                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <TextField
                                fullWidth
                                label={t('legalName')}
                                value={formData.legalName}
                                onChange={(e) => handleChange('legalName', e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label={t('taxId')}
                                value={formData.taxId}
                                onChange={(e) => handleChange('taxId', e.target.value)}
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
                        </Box>
                    </Paper>
                </Grid>

                {/* 3. PRIVACY & GDPR */}
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ShieldIcon fontSize="small" /> {t('gdpr')}
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('privacyPolicyUrlLabel')}
                                    value={formData.privacyPolicyUrl}
                                    onChange={(e) => handleChange('privacyPolicyUrl', e.target.value)}
                                    placeholder={t('privacyPolicyUrlPlaceholder')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label={t('privacyOfficer')}
                                    value={formData.dpoContact}
                                    onChange={(e) => handleChange('dpoContact', e.target.value)}
                                    placeholder={t('dpoContactPlaceholder')}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* 4. COOKIES */}
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: 'action.hover' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CookieIcon color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {t('cookieConsent')}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t('cookieStatus')}
                                    </Typography>
                                </Box>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.cookieBannerActive}
                                        onChange={(e) => handleChange('cookieBannerActive', e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={t('cookieBannerLabel')}
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
                <Button variant="contained" onClick={onSave} size="large">
                    {t('saveButton')}
                </Button>
            </Box>
        </Box>
    );
}
