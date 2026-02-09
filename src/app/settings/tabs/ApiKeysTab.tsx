
import * as React from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    CircularProgress,
    Alert,
    InputAdornment,
    Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslations } from 'next-intl';
import { generateClient } from 'aws-amplify/api';
import { LIST_API_KEYS, CREATE_API_KEY, REVOKE_API_KEY } from '@/graphql/queries';

interface ApiKey {
    apiKeyId: string;
    name?: string;
    keyPreview: string;
    status: string;
    createdAt: string;
    lastUsedAt?: string;
}

export default function ApiKeysTab() {
    const client = React.useMemo(() => generateClient(), []);
    const t = useTranslations('settings.apiKeys');
    const tCommon = useTranslations('common');

    const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });
    const [revokeId, setRevokeId] = React.useState<string | null>(null);
    const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
    const [newKeyName, setNewKeyName] = React.useState('');
    const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);
    const [creating, setCreating] = React.useState(false);

    const fetchKeys = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await client.graphql({
                query: LIST_API_KEYS
            }) as { data: { listApiKeys: ApiKey[] } };
            const keys = response.data.listApiKeys;
            // Descending sort by creation
            keys.sort((a: ApiKey, b: ApiKey) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setApiKeys(keys);
        } catch (error) {
            console.error('Error fetching API keys:', error);
            setSnackbar({ open: true, message: t('errorFetching'), severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [client, t]);

    React.useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;
        setCreating(true);
        try {
            const response = await client.graphql({
                query: CREATE_API_KEY,
                variables: { name: newKeyName }
            }) as { data: { createApiKey: ApiKey & { apiKey: string } } };
            const newKey = response.data.createApiKey;
            setCreatedSecret(newKey.apiKey);
            setApiKeys(prev => [newKey, ...prev]);
            setNewKeyName('');
            setSnackbar({ open: true, message: t('keyCreated'), severity: 'success' });
        } catch (error) {
            console.error('Error creating API key:', error);
            setSnackbar({ open: true, message: t('errorCreating'), severity: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleRevokeClick = (id: string) => {
        setRevokeId(id);
    };

    const handleConfirmRevoke = async () => {
        if (!revokeId) return;
        try {
            await client.graphql({
                query: REVOKE_API_KEY,
                variables: { apiKeyId: revokeId }
            });
            setApiKeys(prev => prev.map(k => k.apiKeyId === revokeId ? { ...k, status: 'REVOKED' } : k));
            setSnackbar({ open: true, message: t('keyRevoked'), severity: 'success' });
        } catch (error) {
            console.error('Error revoking key:', error);
            setSnackbar({ open: true, message: t('errorRevoking'), severity: 'error' });
        } finally {
            setRevokeId(null);
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateKeyOpen(false);
        setCreatedSecret(null);
        setNewKeyName('');
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setSnackbar({ open: true, message: t('copied'), severity: 'success' });
        } catch (err) {
            console.error('Failed to copy keys', err);
            setSnackbar({ open: true, message: t('errorCopying'), severity: 'error' });
        }
    };

    if (loading && apiKeys.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">{t('title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateKeyOpen(true)}
                >
                    {t('createKey')}
                </Button>
            </Box>

            {/* List */}
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{tCommon('name')}</TableCell>
                            <TableCell>{t('keyPrefix')}</TableCell>
                            <TableCell>{tCommon('created')}</TableCell>
                            <TableCell>{tCommon('status')}</TableCell>
                            <TableCell align="right">{tCommon('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && apiKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : apiKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                    <Typography color="textSecondary">{t('noKeys')}</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            apiKeys.map((key) => (
                                <TableRow key={key.apiKeyId}>
                                    <TableCell>{key.name}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{key.keyPreview}</TableCell>
                                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tCommon(key.status.toLowerCase())}
                                            color={key.status === 'ACTIVE' ? 'success' : 'default'}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {key.status === 'ACTIVE' && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleRevokeClick(key.apiKeyId)}
                                                title={t('revoke')}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Dialog */}
            <Dialog open={createKeyOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{createdSecret ? t('createDialog.successTitle') : t('createDialog.title')}</DialogTitle>
                <DialogContent>
                    {createdSecret ? (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                {t('createDialog.warning')}
                            </Alert>
                            <TextField
                                fullWidth
                                label={t('createDialog.secretLabel')}
                                value={createdSecret}
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => copyToClipboard(createdSecret)} edge="end" aria-label="copy">
                                                <ContentCopyIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        </Box>
                    ) : (
                        <TextField
                            autoFocus
                            margin="dense"
                            label={t('createDialog.label')}
                            fullWidth
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            placeholder="e.g. Website Integration"
                            disabled={creating}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    {createdSecret ? (
                        <Button onClick={handleCloseCreateDialog} variant="contained">{tCommon('done')}</Button>
                    ) : (
                        <>
                            <Button onClick={handleCloseCreateDialog} disabled={creating}>{tCommon('cancel')}</Button>
                            <Button onClick={handleCreateKey} variant="contained" disabled={!newKeyName.trim() || creating}>
                                {creating ? <CircularProgress size={24} /> : tCommon('add')}
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Revoke Confirmation Dialog */}
            <Dialog open={!!revokeId} onClose={() => setRevokeId(null)}>
                <DialogTitle>{t('revokeDialog.title')}</DialogTitle>
                <DialogContent>
                    <Typography>{t('revokeDialog.content')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRevokeId(null)}>{tCommon('cancel')}</Button>
                    <Button onClick={handleConfirmRevoke} color="error" variant="contained">
                        {t('revokeDialog.confirm')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
