
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { generateClient } from 'aws-amplify/api';
import { LIST_CLIENTS } from '../../graphql/client-queries';
import ClientForm, { Client } from '../../components/clients/ClientForm';

const client = generateClient();

export default function ClientsPage() {
    const t = useTranslations('clients');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form and Dialog State
    const [formOpen, setFormOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const result = await client.graphql({
                query: LIST_CLIENTS
            }) as { data: { listClients: Client[] } };

            setClients(result.data.listClients);
            setError(null);
        } catch (err: unknown) {
            console.error('Error fetching clients:', err);
            setError('Error loading clients. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleCreateClick = () => {
        setSelectedClient(null);
        setFormOpen(true);
    };

    const handleEditClick = (c: Client) => {
        setSelectedClient(c);
        setFormOpen(true);
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {t('title')}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateClick}
                >
                    {t('newClient')}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading ? (
                <Box display="flex" justifyContent="center" p={10}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>{t('table.name')}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{t('table.id')}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{t('table.contact')}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{t('table.date')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('table.actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography py={5} color="textSecondary">
                                            {t('noData')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((c) => (
                                    <TableRow key={c.id} hover>
                                        <TableCell>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {c.names.given} {c.names.family}
                                            </Typography>
                                            {c.occupation && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {c.occupation}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {c.identifiers.map((id, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`${id.type}: ${id.value}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                />
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            {c.contactInfo?.map((contact, index) => (
                                                <Typography key={index} variant="body2" display="block">
                                                    <strong>{contact.system === 'email' ? '📧' : '📞'}</strong> {contact.value}
                                                </Typography>
                                            ))}
                                            {(!c.contactInfo || c.contactInfo.length === 0) && (
                                                <Typography variant="body2" color="textSecondary">--</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(c.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={t('tooltips.view')}>
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => handleEditClick(c)} // Viewing uses form for now
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('tooltips.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditClick(c)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <ClientForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                onSuccess={fetchClients}
                initialData={selectedClient}
            />
        </Box>
    );
}
