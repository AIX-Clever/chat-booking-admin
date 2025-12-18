import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import MessageIcon from '@mui/icons-material/Message';

interface MessageNodeProps {
    data: {
        label?: string;
        message?: string;
    };
}

export function MessageNode({ data }: MessageNodeProps) {
    return (
        <Card sx={{
            minWidth: 200,
            border: '1px solid #1976d2',
            borderRadius: '12px',
            boxShadow: 2
        }}>
            <Handle type="target" position={Position.Top} />
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MessageIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2" component="div" fontWeight="bold">
                        {data.label || 'Message'}
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{
                    bgcolor: '#f5f5f5',
                    p: 1,
                    borderRadius: 1,
                    fontStyle: data.message ? 'normal' : 'italic'
                }}>
                    {data.message || 'No message configured'}
                </Typography>
            </CardContent>
            <Handle type="source" position={Position.Bottom} />
        </Card>
    );
}
