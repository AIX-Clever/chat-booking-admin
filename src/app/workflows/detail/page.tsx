'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography } from '@mui/material';
import WorkflowPageClient from './WorkflowPageClient';

function WorkflowDetailParamWrapper() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography color="error">No workflow ID provided.</Typography>
            </Box>
        );
    }

    return <WorkflowPageClient id={id} />;
}

export default function WorkflowDetailPage() {
    return (
        <Suspense fallback={<Typography>Loading...</Typography>}>
            <WorkflowDetailParamWrapper />
        </Suspense>
    );
}
