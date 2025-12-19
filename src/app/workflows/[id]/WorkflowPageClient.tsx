'use client';

import { Box, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import WorkflowEditor from '../../../components/workflow/WorkflowEditor';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function WorkflowPageClient({ id }: { id: string }) {
    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/workflows">
                            Workflows
                        </Link>
                        <Typography color="text.primary">Edit Workflow</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
                        Workflow Editor
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<SaveIcon />}>
                    Save Workflow
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, position: 'relative' }}>
                <WorkflowEditor />
            </Box>
        </Box>
    );
}
