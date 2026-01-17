
import * as React from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
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
    InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslations } from 'next-intl';
import { generateClient } from 'aws-amplify/api';
import { LIST_API_KEYS, CREATE_API_KEY, REVOKE_API_KEY } from '@/graphql/queries';

interface ApiKeysTabProps {
    hasMounted: boolean;
}

interface ApiKey {
    apiKeyId: string;
    name?: string;
    keyPreview: string;
    status: string;
    createdAt: string;
    lastUsedAt?: string;
}

export default function ApiKeysTab({ hasMounted }: ApiKeysTabProps) {
    const t = useTranslations('settings.apiKeys');
    const tCommon = useTranslations('common');
    const client = generateClient();

    const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [createKeyOpen, setCreateKeyOpen] = React.useState(false);
    const [newKeyName, setNewKeyName] = React.useState('');
    const [creating, setCreating] = React.useState(false);
    const [createdSecret, setCreatedSecret] = React.useState<string | null>(null);

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
        } finally {
            setLoading(false);
        }
    }, [client]);

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
            // Keep dialog open but switch view to show secret? Or separate dialog?
            // Will simple use 'createdSecret' state to conditionally render content in the same dialog
        } catch (error) {
            console.error('Error creating API key:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleCloseCreateDialog = () => {
        setCreateKeyOpen(false);
        setCreatedSecret(null);
        setNewKeyName('');
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm(t('confirmRevoke'))) return; // Simple confirm for now

        try {
            await client.graphql({
                query: REVOKE_API_KEY,
                variables: { apiKeyId: id }
            });
            setApiKeys(prev => prev.map(k => k.apiKeyId === id ? { ...k, status: 'REVOKED' } : k));
        } catch (error) {
            console.error('Error revoking key:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading && apiKeys.length === 0) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">{t('title')}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateKeyOpen(true)}>{t('createKey')}</Button>
            </Box>

            <TableContainer component={Card} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('name')}</TableCell>
                            <TableCell>{t('keyPrefix')}</TableCell>
                            <TableCell>{t('created')}</TableCell>
                            <TableCell>{t('status')}</TableCell>
                            <TableCell align="right">{tCommon('actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apiKeys.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">{t('noKeys')}</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            apiKeys.map((key) => (
                                <TableRow key={key.apiKeyId}>
                                    <TableCell sx={{ fontWeight: 'medium' }}>{key.name || 'API Key'}</TableCell>
                                    <TableCell sx={{ fontFamily: 'monospace' }}>{key.keyPreview}</TableCell>
                                    <TableCell>{hasMounted ? new Date(key.createdAt).toLocaleDateString() : key.createdAt}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={key.status === 'ACTIVE' ? t('active') : t('revoked')}
                                            color={key.status === 'ACTIVE' ? 'success' : 'default'}
                                            size="small"
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRevokeKey(key.apiKeyId)}
                                            disabled={key.status !== 'ACTIVE'}
                                            title={t('revoke')}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Key Dialog */}
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
                                            <IconButton onClick={() => copyToClipboard(createdSecret)} edge="end">
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
        </Box>
    );
}
