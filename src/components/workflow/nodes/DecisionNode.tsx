import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';

interface DecisionNodeProps {
    data: {
        label?: string;
        question?: string;
    };
}

export function DecisionNode({ data }: DecisionNodeProps) {
    return (
        <Card sx={{
            minWidth: 180,
            border: '2px solid #ff9800',
            borderRadius: '50px', // Diamond-ish look via rounded corners
            boxShadow: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Handle type="target" position={Position.Top} />

            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <CallSplitIcon color="warning" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">
                        {data.label || 'Decision'}
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    {data.question || 'Condition?'}
                </Typography>
            </CardContent>

            <Handle type="source" position={Position.Left} id="no" style={{ background: '#f44336' }} />
            <Handle type="source" position={Position.Right} id="yes" style={{ background: '#4caf50' }} />
        </Card>
    );
}
