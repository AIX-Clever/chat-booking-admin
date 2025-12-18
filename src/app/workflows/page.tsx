'use client';

import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';

const SAMPLE_WORKFLOWS = [
    { id: '1', name: 'Main Booking Flow', status: 'Published', lastUpdated: '2 hours ago' },
    { id: '2', name: 'Support FAQ', status: 'Draft', lastUpdated: '1 day ago' },
];

export default function WorkflowsListPage() {
    const router = useRouter();

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

            <Grid container spacing={3}>
                {SAMPLE_WORKFLOWS.map((workflow) => (
                    <Grid item xs={12} sm={6} md={4} key={workflow.id}>
                        <Paper
                            sx={{ p: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                            onClick={() => router.push(`/workflows/${workflow.id}`)}
                        >
                            <Typography variant="h6" gutterBottom>
                                {workflow.name}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {workflow.status}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {workflow.lastUpdated}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
