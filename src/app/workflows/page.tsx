'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Grid, CircularProgress, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { LIST_WORKFLOWS, DELETE_WORKFLOW } from '../../graphql/queries';

const client = generateClient();

interface Workflow {
    workflowId: string;
    name: string;
    description?: string;
    isActive?: boolean;
    updatedAt?: string;
}

export default function WorkflowsListPage() {
    const router = useRouter();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const response: any = await client.graphql({ query: LIST_WORKFLOWS });
            setWorkflows(response.data.listWorkflows);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this workflow?')) {
            try {
                await client.graphql({
                    query: DELETE_WORKFLOW,
                    variables: { workflowId: id }
                });
                setWorkflows(prev => prev.filter(w => w.workflowId !== id));
            } catch (error) {
                console.error('Error deleting workflow:', error);
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                    Workflows
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/workflows/new')}
                >
                    New Workflow
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {workflows.map((workflow) => (
                        <Grid item xs={12} sm={6} md={4} key={workflow.workflowId}>
                            <Paper
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 4 },
                                    position: 'relative'
                                }}
                                onClick={() => router.push(`/workflows/detail?id=${workflow.workflowId}`)}
                            >
                                <Typography variant="h6" gutterBottom>
                                    {workflow.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2 }}>
                                    {workflow.description || 'No description'}
                                </Typography>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : '-'}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => handleDelete(e, workflow.workflowId)}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                    {workflows.length === 0 && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">No workflows found.</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
        </Box>
    );
}
