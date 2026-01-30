'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, CircularProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CREATE_WORKFLOW } from '../../../graphql/queries';
import PlanGuard from '../../../components/PlanGuard';

const client = generateClient();

export default function NewWorkflowPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Please enter a workflow name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const input = {
                name: name,
                description: description,
                isActive: true,
                steps: JSON.stringify({
                    "start": {
                        "stepId": "start",
                        "type": "DYNAMIC_OPTIONS",
                        "content": {
                            "text": "¡Hola! ¿En qué puedo ayudarte?",
                            "sources": [],
                            "options_mapping": {}
                        }
                    }
                }),
                metadata: JSON.stringify({ positions: {} })
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({
                query: CREATE_WORKFLOW,
                variables: { input },
                authToken: token
            });

            const newWorkflow = response.data.createWorkflow;
            router.push(`/workflows/detail?id=${newWorkflow.workflowId}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Error creating workflow:', err);
            setError(err.message || 'Error creating workflow');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PlanGuard minPlan="PRO" featureName="Custom Workflows" variant="overlay" upgradeFeature="AI">
            <Box sx={{ p: 3 }}>
                <Box sx={{ mb: 4 }}>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/workflows">
                            Workflows
                        </Link>
                        <Typography color="text.primary">New Workflow</Typography>
                    </Breadcrumbs>
                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 2 }}>
                        Create New Workflow
                    </Typography>
                </Box>

                <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    <Box component="form" noValidate autoComplete="off">
                        <TextField
                            fullWidth
                            label="Workflow Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            margin="normal"
                            multiline
                            rows={3}
                        />

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                variant="outlined"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleCreate}
                                disabled={loading || !name.trim()}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                            >
                                Create Workflow
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </PlanGuard>
    );
}
