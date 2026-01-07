'use client';


import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
// Assuming GET_TENANT is available in queries, otherwise we define it or import it.
// To be safe and self-contained given I can't browse all files easily, I'll import it if I know the path or redefine it.
// In settings page it was: import { UPDATE_TENANT, GET_TENANT } from '../../graphql/queries';
import { GET_TENANT } from '../../graphql/queries';
import PlanGuard from '../../components/PlanGuard';
import { useTranslations } from 'next-intl';

const GET_UPLOAD_URL = `
  mutation GetUploadUrl($fileName: String!, $contentType: String!) {
    getUploadUrl(fileName: $fileName, contentType: $contentType)
  }
`;

export default function KnowledgePage() {
    const t = useTranslations('knowledge');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [ragEnabled, setRagEnabled] = useState<boolean | null>(null); // null means loading/unknown

    const client = generateClient();

    const checkRagStatus = React.useCallback(async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: null }, // Infers from auth
                authToken: token
            });
            const tenant = response.data.getTenant;
            console.log('🔍 Knowledge - Tenant data:', tenant);

            if (tenant && tenant.settings) {
                const settings = JSON.parse(tenant.settings);
                console.log('🔍 Knowledge - Parsed settings:', settings);
                console.log('🔍 Knowledge - settings.ai:', settings.ai);

                if (settings.ai && typeof settings.ai.enabled !== 'undefined') {
                    console.log('✅ Knowledge - RAG enabled value:', settings.ai.enabled);
                    setRagEnabled(settings.ai.enabled);
                } else {
                    console.log('❌ Knowledge - RAG settings not found, defaulting to false');
                    setRagEnabled(false); // Default to false if not present
                }
            } else {
                console.log('⚠️ Knowledge - No tenant or settings found');
            }
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    }, [client]);

    React.useEffect(() => {
        checkRagStatus();

        // Refetch when page becomes visible (e.g., after navigating from Settings)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                checkRagStatus();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [checkRagStatus]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setMessage(null);

        try {


            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            // 1. Get Presigned URL
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_UPLOAD_URL,
                variables: {
                    fileName: file.name,
                    contentType: file.type
                },
                authToken: token
            });

            const uploadUrl = response.data.getUploadUrl;

            // 2. Upload to S3
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file to S3');
            }

            setMessage({ type: 'success', text: t('uploadSuccess') });
            setFile(null);

        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: t('uploadError') });
        } finally {
            setUploading(false);
        }
    };

    return (
        <PlanGuard minPlan="PRO" featureName="The Knowledge Base">
            <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {t('title')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    {t('subtitle')}
                </Typography>

                {ragEnabled === false && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>{t('ragDisabled')}</strong> {t('ragDisabledMessage')}
                    </Alert>
                )}

                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        {t('uploadSection')}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                        >
                            {t('selectFile')}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.txt,.doc,.docx"
                                onChange={handleFileChange}
                            />
                        </Button>

                        {file && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                {file.name} ({t('fileSize', { size: (file.size / 1024).toFixed(2) })})
                            </Typography>
                        )}
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        >
                            {uploading ? t('uploading') : t('uploadDocument')}
                        </Button>
                    </Box>

                    {message && (
                        <Alert severity={message.type} sx={{ mt: 2 }}>
                            {message.text}
                        </Alert>
                    )}
                </Paper>

                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            {t('recentDocuments')}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {/* Placeholder List - To be replaced with real data query */}
                        <List>
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircleIcon color="success" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="test_document.txt"
                                    secondary="Uploaded: Just now - Status: INDEXED (Verified in Backend)"
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon>
                                    <CheckCircleIcon color="disabled" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="pricing_guide_v1.pdf"
                                    secondary="Uploaded: 2 days ago - Status: INDEXED"
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>
            </Box>
        </PlanGuard>
    );
}
