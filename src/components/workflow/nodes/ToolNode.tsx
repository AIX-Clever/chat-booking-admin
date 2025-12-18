import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

interface ToolNodeProps {
    data: {
        label?: string;
        toolName?: string;
    };
}

export function ToolNode({ data }: ToolNodeProps) {
    return (
        <Card sx={{
            minWidth: 200,
            border: '1px solid #9c27b0',
            borderRadius: '8px',
            boxShadow: 2,
            bgcolor: '#f3e5f5'
        }}>
            <Handle type="target" position={Position.Top} />

            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BuildIcon color="secondary" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">
                        {data.toolName || 'Tool Call'}
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Executes backend function
                </Typography>
            </CardContent>

            <Handle type="source" position={Position.Bottom} />
        </Card>
    );
}
