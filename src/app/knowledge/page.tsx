'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Card,
    CardContent,
    TextField,
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
// Assuming GET_TENANT is available in queries, otherwise we define it or import it.
// To be safe and self-contained given I can't browse all files easily, I'll import it if I know the path or redefine it.
// In settings page it was: import { UPDATE_TENANT, GET_TENANT } from '../../graphql/queries';
import { GET_TENANT } from '../../graphql/queries';
import PlanGuard from '../../components/PlanGuard';

const GET_UPLOAD_URL = `
  mutation GetUploadUrl($fileName: String!, $contentType: String!) {
    getUploadUrl(fileName: $fileName, contentType: $contentType)
  }
`;

export default function KnowledgePage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [ragEnabled, setRagEnabled] = useState<boolean | null>(null); // null means loading/unknown

    const client = generateClient();

    React.useEffect(() => {
        checkRagStatus();
    }, []);

    const checkRagStatus = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_TENANT,
                variables: { tenantId: null } // Infers from auth
            });
            const tenant = response.data.getTenant;
            if (tenant && tenant.settings) {
                const settings = JSON.parse(tenant.settings);
                if (settings.ai && typeof settings.ai.enabled !== 'undefined') {
                    setRagEnabled(settings.ai.enabled);
                } else {
                    setRagEnabled(false); // Default to false if not present
                }
            }
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    };

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


            // 1. Get Presigned URL
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: GET_UPLOAD_URL,
                variables: {
                    fileName: file.name,
                    contentType: file.type
                }
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

            setMessage({ type: 'success', text: 'Document uploaded successfully! Processing started.' });
            setFile(null);

        } catch (error) {
            console.error('Upload error:', error);
            setMessage({ type: 'error', text: 'Failed to upload document. Please try again.' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <PlanGuard minPlan="PRO" featureName="The Knowledge Base">
            <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Knowledge Base
                </Typography>
                <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
                    Upload documents (PDF, Text) to train your AI agent.
                </Typography>

                {ragEnabled === false && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        <strong>RAG is currently disabled.</strong> Uploaded documents will be stored but the AI Agent won't use them until you enable "Knowledge Retrieval" in Settings.
                    </Alert>
                )}

                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Upload New Document
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                        >
                            Select File
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.txt,.doc,.docx"
                                onChange={handleFileChange}
                            />
                        </Button>

                        {file && (
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
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
                            {uploading ? 'Uploading...' : 'Upload Document'}
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
                            Recent Documents
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
