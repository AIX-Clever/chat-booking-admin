'use client';


import * as React from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { LIST_FAQS, CREATE_FAQ, UPDATE_FAQ, DELETE_FAQ } from '../../graphql/queries';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PlanGuard from '../../components/PlanGuard';
import {
    Typography,
    Button,
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import { useTranslations } from 'next-intl';

// --- Types ---
interface FAQ {
    faqId: string;
    question: string;
    answer: string;
    category: string;
    active: boolean;
}

const client = generateClient();

export default function FAQsPage() {
    const t = useTranslations('faqs');
    const tCommon = useTranslations('common');
    const [faqs, setFaqs] = React.useState<FAQ[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

    // Dialog States
    const [open, setOpen] = React.useState(false);
    const [currentFAQ, setCurrentFAQ] = React.useState<FAQ | null>(null);

    // Form State
    const [formData, setFormData] = React.useState({
        question: '',
        answer: '',
        category: 'General',
        active: true
    });

    // Confirmation Dialog
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [confirmConfig, setConfirmConfig] = React.useState<{
        title: string;
        content: string;
        action: () => void;
    }>({ title: '', content: '', action: () => { } });

    React.useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        setLoading(true);
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response: any = await client.graphql({ query: LIST_FAQS });
            setFaqs(response.data.listFAQs);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (faq?: FAQ) => {
        if (faq) {
            setCurrentFAQ(faq);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                category: faq.category,
                active: faq.active
            });
        } else {
            setCurrentFAQ(null);
            setFormData({
                question: '',
                answer: '',
                category: 'General',
                active: true
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = async () => {
        try {
            // Securely fetch ID Token
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            if (currentFAQ) {
                // Edit
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response: any = await client.graphql({
                    query: UPDATE_FAQ,
                    variables: {
                        input: {
                            faqId: currentFAQ.faqId,
                            question: formData.question,
                            answer: formData.answer,
                            category: formData.category,
                            active: formData.active
                        }
                    },
                    authToken: token
                });
                const updated = response.data.updateFAQ;
                setFaqs((prev) =>
                    prev.map((f) => (f.faqId === currentFAQ.faqId ? updated : f))
                );
            } else {
                // Create
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response: any = await client.graphql({
                    query: CREATE_FAQ,
                    variables: {
                        input: {
                            question: formData.question,
                            answer: formData.answer,
                            category: formData.category,
                            active: formData.active
                        }
                    },
                    authToken: token
                });
                const created = response.data.createFAQ;
                setFaqs((prev) => [...prev, created]);
            }
            setOpen(false);
        } catch (error) {
            console.error('Error saving FAQ:', error);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            title: t('deleteDialog.title'),
            content: t('deleteDialog.message'),
            action: async () => {
                try {
                    const session = await fetchAuthSession();
                    const token = session.tokens?.idToken?.toString();

                    await client.graphql({
                        query: DELETE_FAQ,
                        variables: { faqId: id },
                        authToken: token
                    });
                    setFaqs((prev) => prev.filter((f) => f.faqId !== id));
                    setConfirmOpen(false);
                } catch (error) {
                    console.error('Error deleting FAQ:', error);
                }
            }
        });
        setConfirmOpen(true);
    };

    const filteredFAQs = faqs.filter((f) =>
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <PlanGuard minPlan="PRO" featureName="Gestión de FAQs" upgradeFeature="USAGE" variant="overlay">
            <ConfirmDialog
                open={confirmOpen}
                title={confirmConfig.title}
                content={confirmConfig.content}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmConfig.action}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 5 }}>
                <Typography variant="h4">{t('title')}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    {t('newFaq')}
                </Button>
            </Box>

            <Card>
                <Box sx={{ p: 3 }}>
                    <TextField
                        fullWidth
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell width="50px" />
                                    <TableCell>{t('question')}</TableCell>
                                    <TableCell>{t('category')}</TableCell>
                                    <TableCell>{t('status')}</TableCell>
                                    <TableCell align="right">{tCommon('actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredFAQs.map((row) => {
                                    const isExpanded = expandedRows.has(row.faqId);
                                    return (
                                        <React.Fragment key={row.faqId}>
                                            <TableRow hover sx={{ cursor: 'pointer' }}>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            const newExpanded = new Set(expandedRows);
                                                            if (isExpanded) {
                                                                newExpanded.delete(row.faqId);
                                                            } else {
                                                                newExpanded.add(row.faqId);
                                                            }
                                                            setExpandedRows(newExpanded);
                                                        }}
                                                    >
                                                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell onClick={() => {
                                                    const newExpanded = new Set(expandedRows);
                                                    if (isExpanded) {
                                                        newExpanded.delete(row.faqId);
                                                    } else {
                                                        newExpanded.add(row.faqId);
                                                    }
                                                    setExpandedRows(newExpanded);
                                                }}>
                                                    <Typography variant="subtitle2">
                                                        {row.question}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{row.category}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={row.active ? t('active') : t('inactive')}
                                                        color={row.active ? 'success' : 'default'}
                                                        size="small"
                                                        variant="filled"
                                                        sx={{ borderRadius: 1 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => handleOpen(row)} color="primary">
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(row.faqId)} color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                        <Box sx={{ py: 2, px: 3, bgcolor: 'action.hover', borderRadius: 1, my: 1 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                                {t('answer')}
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                                                                {row.answer}
                                                            </Typography>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })}
                                {filteredFAQs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1" color="text.secondary">
                                                {t('noFaqsFound')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>

            {/* FAQ Dialog */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{currentFAQ ? t('editFaq') : t('newFaq')}</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                        <TextField
                            label="Question"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        />
                        <TextField
                            label="Answer"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        />
                        <TextField
                            label="Category"
                            fullWidth
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.active}
                                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                />
                            }
                            label={t('active')}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.question || !formData.answer}>
                        {tCommon('save')}
                    </Button>
                </DialogActions>
            </Dialog>
        </PlanGuard>
    );
}
