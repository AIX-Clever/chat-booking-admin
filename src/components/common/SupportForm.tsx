import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    CircularProgress,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { generateClient } from 'aws-amplify/api';
import { useToast } from './ToastContext';
import { useTenant } from '@/context/TenantContext';

const client = generateClient();

const CREATE_SUPPORT_ISSUE = `
  mutation CreateSupportIssue($input: SupportIssueInput!) {
    createSupportIssue(input: $input)
  }
`;

interface SupportFormProps {
    open: boolean;
    onClose: () => void;
}

export const SupportForm: React.FC<SupportFormProps> = ({ open, onClose }) => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { tenant } = useTenant();

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) {
            showToast('Por favor completa todos los campos', 'error');
            return;
        }

        if (!tenant?.tenantId) {
            showToast('Error al identificar el tenant', 'error');
            return;
        }

        setLoading(true);
        try {
            const result = await client.graphql({
                query: CREATE_SUPPORT_ISSUE,
                variables: {
                    input: {
                        subject,
                        description,
                        tenantId: tenant.tenantId
                    }
                }
            });

            console.log('Support issue result:', result);
            showToast('Ticket de soporte creado con éxito', 'success');
            handleClose();
        } catch (error) {
            console.error('Error creating support issue:', error);
            showToast('Error al crear el ticket. Intenta nuevamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSubject('');
        setDescription('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Contactar Soporte
                {!loading && (
                    <IconButton
                        aria-label="close"
                        onClick={handleClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Describe tu problema o sugerencia. El equipo técnico revisará tu solicitud lo antes posible.
                </Typography>

                <TextField
                    autoFocus
                    margin="dense"
                    label="Asunto"
                    fullWidth
                    variant="outlined"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={loading}
                    sx={{ mb: 2 }}
                />

                <TextField
                    margin="dense"
                    label="Descripción detallada"
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || !subject.trim() || !description.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Enviando...' : 'Enviar Ticket'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
