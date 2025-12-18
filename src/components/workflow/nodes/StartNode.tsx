import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export function StartNode() {
    return (
        <Card sx={{
            minWidth: 150,
            border: '2px solid #4caf50',
            borderRadius: '20px',
            boxShadow: 3
        }}>
            <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <PlayArrowIcon color="success" />
                    <Typography variant="h6" component="div">
                        Start
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Conversation Entry Point
                </Typography>
                <Handle type="source" position={Position.Bottom} />
            </CardContent>
        </Card>
    );
}
