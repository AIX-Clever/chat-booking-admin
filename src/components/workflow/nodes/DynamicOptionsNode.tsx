import { Handle, Position } from '@xyflow/react';
import { Card, CardContent, Typography, Box, Chip, Divider } from '@mui/material';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

interface DynamicOptionsNodeProps {
    data: {
        label?: string;
        text?: string;
        sources?: string[]; // ['SERVICES', 'PROVIDERS', 'FAQS']
    };
}

export function DynamicOptionsNode({ data }: DynamicOptionsNodeProps) {
    const sources = data.sources || [];

    return (
        <Card sx={{
            minWidth: 250,
            border: '2px solid #9c27b0', // Purple
            borderRadius: '12px',
            boxShadow: 3
        }}>
            <Handle type="target" position={Position.Top} />

            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DashboardCustomizeIcon color="secondary" />
                    <Typography variant="subtitle2" component="div" fontWeight="bold">
                        {data.label || 'Dynamic Options'}
                    </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                    {data.text || 'Greeting text...'}
                </Typography>

                <Divider sx={{ mb: 1 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {sources.length === 0 && (
                        <Typography variant="caption" color="error">No sources selected</Typography>
                    )}

                    {sources.includes('SERVICES') && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip size="small" label="Services" color="primary" variant="outlined" />
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="source-SERVICES"
                                style={{ top: 'auto', right: -10, position: 'relative' }}
                            />
                        </Box>
                    )}

                    {sources.includes('PROVIDERS') && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip size="small" label="Providers" color="secondary" variant="outlined" />
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="source-PROVIDERS"
                                style={{ top: 'auto', right: -10, position: 'relative' }}
                            />
                        </Box>
                    )}

                    {sources.includes('FAQS') && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Chip size="small" label="FAQs" color="default" variant="outlined" />
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="source-FAQS"
                                style={{ top: 'auto', right: -10, position: 'relative' }}
                            />
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
