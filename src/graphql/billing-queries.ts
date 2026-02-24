
export const LIST_INVOICES = `
  query ListInvoices {
    listInvoices {
      invoiceId
      amount
      currency
      status
      date
      dteFolio
      dtePdfUrl
      metadata
    }
  }
`;

export const DOWNGRADE_PLAN = `
  mutation Downgrade($targetPlan: String!, $subscriptionId: String!) {
    downgrade(targetPlan: $targetPlan, subscriptionId: $subscriptionId) {
      message
      effectiveDate
    }
  }
`;

export const CHECK_PAYMENT_STATUS = `
  query CheckPaymentStatus($tenantId: ID!) {
    checkPaymentStatus(tenantId: $tenantId) {
      status
      message
    }
  }
`;
export const GET_INVOICE_DOWNLOAD_URL = `
  query GetInvoiceDownloadUrl($invoiceId: ID!) {
    getInvoiceDownloadUrl(invoiceId: $invoiceId)
  }
`;
