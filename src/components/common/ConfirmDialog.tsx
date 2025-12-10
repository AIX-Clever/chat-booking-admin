import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    useTheme,
    alpha
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';

interface Props {
    open: boolean;
    title: string;
    content: string;
    onClose: () => void;
    onConfirm: () => void;
    confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmDialog({
    open,
    title,
    content,
    onClose,
    onConfirm,
    confirmColor = 'error',
    confirmText = 'Delete',
    cancelText = 'Cancel',
}: Props) {
    const theme = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: theme.shadows[24],
                }
            }}
        >
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Box
                    sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        bgcolor: alpha(theme.palette[confirmColor].main, 0.16),
                        color: theme.palette[confirmColor].main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2
                    }}
                >
                    <WarningAmberRoundedIcon sx={{ fontSize: 32 }} />
                </Box>

                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {content}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        onClick={onClose}
                        sx={{ borderRadius: 1.5 }}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        fullWidth
                        variant="contained"
                        color={confirmColor}
                        onClick={onConfirm}
                        sx={{ borderRadius: 1.5, boxShadow: 'none' }}
                    >
                        {confirmText}
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
}
