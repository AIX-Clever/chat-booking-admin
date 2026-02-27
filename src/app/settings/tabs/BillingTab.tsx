'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { GET_TENANT } from '../../../graphql/queries';
import { LIST_INVOICES, GET_INVOICE_DOWNLOAD_URL } from '../../../graphql/billing-queries';
import {
    Description as DocumentTextIcon,
    CreditCard as CreditCardIcon,
    Download as ArrowDownTrayIcon,
    CheckCircle as CheckCircleIcon,
    ExpandMore as ExpandMoreIcon,
    Info as InfoIcon,
    Shield as ShieldIcon,
    Cookie as CookieIcon
} from '@mui/icons-material';
import { useAuthenticator } from '@aws-amplify/ui-react';
// import { useTranslations } from 'next-intl';
import {
    Paper,
    Typography,
    Box,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Skeleton,
    TextField,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider,
    Snackbar,
    Switch,
    Grid
} from '@mui/material';
import { UPDATE_TENANT } from '../../../graphql/queries';
import { getPlanDetails } from '../../../utils/plans';

const client = generateClient();

interface Invoice {
    invoiceId: string;
    amount: number;
    currency: string;
    status: string;
    date: string;
    dteFolio?: string;
    dtePdfUrl?: string;
}

export default function BillingTab() {
    // const tCommon = useTranslations('common');
    // const tBilling = useTranslations('settings.billing');
    // const tLegal = useTranslations('settings.compliance');
    const { user } = useAuthenticator((context) => [context.user]);
    const [loading, setLoading] = useState(true);
    const [tenant, setTenant] = useState<any>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Billing Form State
    const [billingType, setBillingType] = useState<'39' | '33'>('39'); // 39=Boleta, 33=Factura
    const [billingData, setBillingData] = useState({
        rut: '',
        name: '',
        giro: '',
        address: '',
        comuna: '',
        email: ''
    });

    // Legal Form State (merged from Compliance)
    const [legalData, setLegalData] = useState({
        privacyPolicyUrl: '',
        dpoContact: '',
        cookieBannerActive: true
    });

    const fetchData = React.useCallback(async () => {
        try {
            if (!user) return;

            const session = await fetchAuthSession();
            const tId = session.tokens?.idToken?.payload['custom:tenantId'] as string | undefined;

            if (!tId) return;

            // 1. Fetch Tenant (Plan info)
            try {
                const tenantData: any = await client.graphql({
                    query: GET_TENANT,
                    variables: { tenantId: tId }
                });
                const t = tenantData.data.getTenant;
                setTenant(t);

                // Initialize Billing Form from Settings or Profile (for defaults)
                const b = t?.settings?.billing;
                const p = t?.settings?.profile;

                if (b) {
                    setBillingType(b.tipoDte === '33' ? '33' : '39');
                    setBillingData({
                        rut: b.rut || '',
                        name: b.name || '',
                        giro: b.giro || '',
                        address: b.address || '',
                        comuna: b.comuna || '',
                        email: b.email || ''
                    });
                } else if (p) {
                    // Pre-populate defaults from profile if billing is not yet set
                    setBillingData({
                        rut: p.taxId || '',
                        name: p.legalName || '',
                        giro: '', // Not in profile usually
                        address: p.address?.street || '',
                        comuna: p.address?.city || '',
                        email: p.email || t.billingEmail || ''
                    });
                }

                // Initialize Legal Data from Profile
                if (p) {
                    setLegalData({
                        privacyPolicyUrl: p.privacyPolicyUrl || '',
                        dpoContact: p.dpoContact || '',
                        cookieBannerActive: typeof p.cookieBannerActive !== 'undefined' ? p.cookieBannerActive : true
                    });
                }
            } catch (e) {
                console.warn("Could not fetch tenant", e);
            }

            // 2. Fetch Invoices
            try {
                const invoicesData: any = await client.graphql({
                    query: LIST_INVOICES
                });
                const fetchedInvoices = invoicesData.data.listInvoices || [];

                // Sort by date desc
                const sorted = fetchedInvoices.sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setInvoices(sorted);
            } catch (e) {
                console.warn("Could not fetch invoices", e);
            }

        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
            setLoadingInvoices(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [user, fetchData]);

    async function handleDownloadInvoice(invoiceId: string) {
        try {
            const result: any = await client.graphql({
                query: GET_INVOICE_DOWNLOAD_URL,
                variables: { invoiceId }
            });
            const url = result.data.getInvoiceDownloadUrl;
            if (url) {
                window.open(url, '_blank');
            } else {
                alert("No se pudo obtener el enlace de descarga.");
            }
        } catch (err) {
            console.error("Error fetching download URL:", err);
            alert("Error al intentar descargar la factura.");
        }
    }

    async function handleSubscribe() {
        // Mock subscribe or actual logic
        alert("Redirigiendo a pasarela de pago...");
    }

    async function handleSaveBilling() {
        if (!tenant) return;
        setSaving(true);
        try {
            const currentSettings = tenant.settings || {};
            const newBilling = {
                ...billingData,
                tipoDte: billingType
            };

            await client.graphql({
                query: UPDATE_TENANT,
                variables: {
                    input: {
                        settings: JSON.stringify({
                            ...currentSettings,
                            billing: newBilling,
                            profile: {
                                ...(currentSettings.profile || {}),
                                ...legalData
                            }
                        })
                    }
                }
            });

            setSnackbar({
                open: true,
                message: 'Preferencias de facturación guardadas correctamente.',
                severity: 'success'
            });

            // Update local state to reflect changes
            setTenant({
                ...tenant,
                settings: {
                    ...currentSettings,
                    billing: newBilling
                }
            });

        } catch (err) {
            console.error("Error updating billing preferences:", err);
            setSnackbar({
                open: true,
                message: 'Error al guardar los datos de facturación.',
                severity: 'error'
            });
        } finally {
            setSaving(false);
        }
    }

    // Derived State
    const planDetails = getPlanDetails(tenant?.plan);

    // Calculate "Paid Until" and Status
    const lastPaidInvoice = invoices.find(inv => inv.status === 'PAID');
    let paidUntilDate = new Date();
    let isTrial = false;

    if (lastPaidInvoice) {
        const invoiceDate = new Date(lastPaidInvoice.date);
        paidUntilDate = new Date(invoiceDate);
        paidUntilDate.setMonth(invoiceDate.getMonth() + 1);
    } else if (tenant?.createdAt) {
        const created = new Date(tenant.createdAt);
        paidUntilDate = new Date(created);
        paidUntilDate.setDate(created.getDate() + 15); // 15 days standard trial
        isTrial = true;
    }

    const isExpired = paidUntilDate < new Date();
    const statusLabel = isExpired ? 'Pago Pendiente' : (isTrial ? 'Periodo de Prueba' : 'Pagos al día');
    const statusColor = isExpired ? 'error' : (isTrial ? 'info' : 'success');
    const statusBg = isExpired ? '#fef2f2' : (isTrial ? '#eff6ff' : '#dcfce7');
    const statusText = isExpired ? '#991b1b' : (isTrial ? '#1e40af' : '#166534');

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount);
    };

    const getPeriod = (dateStr: string) => {
        const start = new Date(dateStr);
        const end = new Date(start);
        end.setMonth(start.getMonth() + 1);
        return `${formatDate(start)} - ${formatDate(end)}`;
    };

    if (loading) return (
        <Box sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 4, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
    );

    return (
        <Box sx={{ width: '100%', py: 2 }}>

            {/* 1. Plan Details Card */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon color="primary" sx={{ fontSize: 24 }} />
                        <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {planDetails.name}
                        </Typography>
                    </Box>
                    <Chip
                        label={statusLabel}
                        color={statusColor}
                        size="small"
                        sx={{ bgcolor: statusBg, color: statusText, fontWeight: 'bold' }}
                    />
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                    Capacidad profesionales: {planDetails.capacity}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
                    Mensualidad: {formatCurrency(planDetails.price)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Pagado hasta: {formatDate(paidUntilDate)}
                </Typography>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, bgcolor: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe' }}>
                    Los pagos de Hola Lucia se realizan durante los primeros 10 días del mes que se está utilizando el servicio.
                </Alert>

                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    startIcon={<CreditCardIcon />}
                    onClick={handleSubscribe}
                    sx={{ mb: 2, bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' }, textTransform: 'none', fontWeight: 'bold' }}
                >
                    Pagar suscripción
                </Button>

                <Accordion elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: '8px !important', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0369a1' }}>
                            <DocumentTextIcon fontSize="small" />
                            <Typography fontWeight="medium">Ver datos para pago por transferencia</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Banco:</strong> Banco Security<br />
                            <strong>Cuenta Corriente:</strong> 12345678<br />
                            <strong>RUT:</strong> 76.xxx.xxx-k<br />
                            <strong>Email:</strong> pagos@holalucia.ai
                        </Typography>
                    </AccordionDetails>
                </Accordion>

                <Box sx={{ display: 'flex', gap: 4, mt: 3, justifyContent: 'center' }}>
                    <Box component="a" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0369a1', textDecoration: 'none', fontWeight: 'medium', fontSize: '0.875rem' }}>
                        Respaldo Información <ArrowDownTrayIcon fontSize="small" sx={{ transform: 'rotate(-45deg)' }} />
                    </Box>
                    <Box component="a" href="#" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#0369a1', textDecoration: 'none', fontWeight: 'medium', fontSize: '0.875rem' }}>
                        Términos y condiciones <ArrowDownTrayIcon fontSize="small" sx={{ transform: 'rotate(-45deg)' }} />
                    </Box>
                </Box>
            </Paper>

            {/* 2. Billing Settings Card */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0c4a6e' }}>
                    Preferencias de Facturación
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configura cómo deseas recibir los comprobantes de cobro de tu suscripción a Hola Lucia.
                </Typography>

                <FormControl component="fieldset" sx={{ mb: 4 }}>
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 1 }}>Tipo de Documento</FormLabel>
                    <RadioGroup
                        row
                        value={billingType}
                        onChange={(e: any) => setBillingType(e.target.value)}
                    >
                        <FormControlLabel value="39" control={<Radio />} label="Boleta" />
                        <FormControlLabel value="33" control={<Radio />} label="Factura" />
                    </RadioGroup>
                </FormControl>

                {billingType === '33' && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>Datos de Facturación</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                            <TextField
                                label="RUT Empresa"
                                size="small"
                                fullWidth
                                value={billingData.rut}
                                onChange={(e) => setBillingData({ ...billingData, rut: e.target.value })}
                                placeholder="76.xxx.xxx-x"
                            />
                            <TextField
                                label="Razón Social"
                                size="small"
                                fullWidth
                                value={billingData.name}
                                onChange={(e) => setBillingData({ ...billingData, name: e.target.value })}
                            />
                            <TextField
                                label="Giro"
                                size="small"
                                fullWidth
                                value={billingData.giro}
                                onChange={(e) => setBillingData({ ...billingData, giro: e.target.value })}
                            />
                            <TextField
                                label="Dirección"
                                size="small"
                                fullWidth
                                value={billingData.address}
                                onChange={(e) => setBillingData({ ...billingData, address: e.target.value })}
                            />
                            <TextField
                                label="Comuna"
                                size="small"
                                fullWidth
                                value={billingData.comuna}
                                onChange={(e) => setBillingData({ ...billingData, comuna: e.target.value })}
                            />
                            <TextField
                                label="Email Facturación"
                                size="small"
                                type="email"
                                fullWidth
                                value={billingData.email}
                                onChange={(e) => setBillingData({ ...billingData, email: e.target.value })}
                                placeholder="dte@empresa.com"
                            />
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSaveBilling}
                        disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 'bold', minWidth: 150 }}
                    >
                        {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </Button>
                </Box>
            </Paper>

            {/* 3. Legal & Privacy Settings (Merged) */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: 2, mb: 4 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#0c4a6e', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon fontSize="small" /> Privacidad y Legal
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configura la identidad legal y el cumplimiento normativo de tu negocio.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="URL Política de Privacidad"
                            value={legalData.privacyPolicyUrl}
                            onChange={(e) => setLegalData({ ...legalData, privacyPolicyUrl: e.target.value })}
                            placeholder="https://..."
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Delegado de Protección de Datos (DPO)"
                            value={legalData.dpoContact}
                            onChange={(e) => setLegalData({ ...legalData, dpoContact: e.target.value })}
                            placeholder="Nombre o Email"
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CookieIcon color="primary" />
                                <Box>
                                    <Typography variant="subtitle2" fontWeight="bold">Banner de Cookies</Typography>
                                    <Typography variant="caption" color="text.secondary">Activa el consentimiento de cookies en tu sitio público.</Typography>
                                </Box>
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={legalData.cookieBannerActive}
                                        onChange={(e) => setLegalData({ ...legalData, cookieBannerActive: e.target.checked })}
                                        color="primary"
                                    />
                                }
                                label=""
                                sx={{ mr: 0 }}
                            />
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSaveBilling}
                        disabled={saving}
                        sx={{ textTransform: 'none', fontWeight: 'bold', minWidth: 150 }}
                    >
                        {saving ? 'Guardando...' : 'Guardar Privacidad'}
                    </Button>
                </Box>
            </Paper>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* 3. Invoice History */}
            <Paper elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DocumentTextIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold" color="#0c4a6e">
                        Resumen de pagos/cobros por mensualidad
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Fecha</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Período</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Monto</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#334155' }}>N° de factura</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loadingInvoices ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Cargando pagos...</TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No hay pagos registrados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.invoiceId} hover>
                                        <TableCell>{formatDate(new Date(invoice.date))}</TableCell>
                                        <TableCell>{getPeriod(invoice.date)}</TableCell>
                                        <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: invoice.status === 'PAID' ? '#166534' : '#b45309' }}>
                                                {invoice.status === 'PAID' ? 'Pagos al dia' : 'Pendiente'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{invoice.dteFolio || invoice.invoiceId.substring(0, 8)}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                sx={{ minWidth: '40px', px: 0, bgcolor: '#0284c7' }}
                                                onClick={() => handleDownloadInvoice(invoice.invoiceId)}
                                            >
                                                <ArrowDownTrayIcon fontSize="small" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
