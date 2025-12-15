
import * as React from 'react';
import {
    Box,
    Card,
    Paper,
    Typography,
    Avatar,
    IconButton,
    Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';

interface WidgetPreviewProps {
    widgetConfig: {
        primaryColor: string;
        position: string;
        language: string;
        welcomeMessage: string;
    };
}

export default function WidgetPreview({ widgetConfig }: WidgetPreviewProps) {
    return (
        <Card variant="outlined" sx={{ p: 0, bgcolor: '#f1f5f9', height: 500, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRadius: 3 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0', bgcolor: 'white' }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Live Web Preview</Typography>
            </Box>

            {/* Simulated Web Content */}
            <Box sx={{ flex: 1, p: 4, opacity: 0.5 }}>
                <Box sx={{ height: 200, bgcolor: '#cbd5e1', borderRadius: 2, mb: 2, width: '70%' }} />
                <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, mb: 1, width: '100%' }} />
                <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, mb: 1, width: '90%' }} />
                <Box sx={{ height: 20, bgcolor: '#cbd5e1', borderRadius: 1, width: '60%' }} />
            </Box>

            {/* Widget Window */}
            <Paper
                elevation={4}
                sx={{
                    position: 'absolute',
                    bottom: 90,
                    [widgetConfig.position === 'bottom-right' ? 'right' : 'left']: 24,
                    width: 320,
                    height: 380,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <Box sx={{ p: 2, bgcolor: widgetConfig.primaryColor, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}><AutoAwesomeIcon sx={{ fontSize: 18 }} /></Avatar>
                        <Box>
                            <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>Chat Support</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>Online</Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" sx={{ color: 'white' }}><CloseIcon /></IconButton>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, p: 2, bgcolor: '#f8fafc', overflowY: 'auto' }}>
                    <Stack spacing={2} alignItems="flex-start">
                        <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: '0 12px 12px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', maxWidth: '85%' }}>
                            <Typography variant="body2" color="text.secondary">{widgetConfig.welcomeMessage}</Typography>
                        </Box>
                    </Stack>
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f1f5f9', p: 1, borderRadius: 2 }}>
                        <Typography variant="body2" color="text.disabled" sx={{ flex: 1, ml: 1 }}>Type a message...</Typography>
                        <IconButton size="small" sx={{ color: widgetConfig.primaryColor }}>
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Launcher FAB */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: 24,
                    [widgetConfig.position === 'bottom-right' ? 'right' : 'left']: 24,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: widgetConfig.primaryColor,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 3,
                    cursor: 'pointer'
                }}
            >
                <ChatIcon />
            </Box>
        </Card>
    );
}
