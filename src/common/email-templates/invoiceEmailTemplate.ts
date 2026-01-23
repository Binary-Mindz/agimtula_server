export function invoiceEmailTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  issueDate: Date;
  companyName: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentLink?: string;
  notes?: string;
  appUrl: string;
  logoUrl: string;
}) {
  const formatDate = (date: Date) => date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formatCurrency = (amount: number) => `${data.currency} ${amount.toFixed(2)}`;

  const itemsHtml = data.items.map(item => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 0; color: #374151;">${item.description}</td>
      <td style="padding: 12px 0; text-align: center; color: #6b7280;">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right; color: #6b7280;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${data.invoiceNumber}</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
  <tr>
    <td align="center">
      <table width="600" style="background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.06);">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px; border-bottom:1px solid #eef1f6;">
            <table width="100%">
              <tr>
                <td>
                  <img src="${data.logoUrl}" alt="ExpoInvoice" style="height:36px;" />
                </td>
                <td align="right">
                  <h1 style="margin:0; color:#111827; font-size:24px;">INVOICE</h1>
                  <p style="margin:4px 0 0; color:#6b7280; font-size:14px;">#${data.invoiceNumber}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Invoice Details -->
        <tr>
          <td style="padding:32px;">
            <table width="100%" style="margin-bottom:24px;">
              <tr>
                <td style="vertical-align:top;">
                  <h3 style="margin:0 0 8px; color:#111827; font-size:16px;">Bill To:</h3>
                  <p style="margin:0; color:#374151; font-weight:600;">${data.clientName}</p>
                </td>
                <td align="right" style="vertical-align:top;">
                  <table style="text-align:right;">
                    <tr>
                      <td style="color:#6b7280; padding:2px 8px;">Issue Date:</td>
                      <td style="font-weight:600; padding:2px 0;">${formatDate(data.issueDate)}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280; padding:2px 8px;">Due Date:</td>
                      <td style="font-weight:600; padding:2px 0; color:#dc2626;">${formatDate(data.dueDate)}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280; padding:2px 8px;">From:</td>
                      <td style="font-weight:600; padding:2px 0;">${data.companyName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <table width="100%" style="border-collapse:collapse; margin:24px 0;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:12px 0; text-align:left; color:#374151; font-weight:600;">Description</th>
                  <th style="padding:12px 0; text-align:center; color:#374151; font-weight:600;">Qty</th>
                  <th style="padding:12px 0; text-align:right; color:#374151; font-weight:600;">Unit Price</th>
                  <th style="padding:12px 0; text-align:right; color:#374151; font-weight:600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total Section -->
            <table width="100%" style="margin:24px 0;">
              <tr>
                <td width="60%"></td>
                <td width="40%">
                  <table width="100%" style="background:#f9fafb; border-radius:8px; padding:16px;">
                    <tr>
                      <td style="color:#6b7280; padding:4px 0;">Subtotal:</td>
                      <td align="right" style="font-weight:600; padding:4px 0;">${formatCurrency(data.amount)}</td>
                    </tr>
                    <tr style="border-top:1px solid #e5e7eb;">
                      <td style="color:#111827; font-weight:700; font-size:16px; padding:8px 0 4px;">Total Amount:</td>
                      <td align="right" style="color:#111827; font-weight:700; font-size:18px; padding:8px 0 4px;">${formatCurrency(data.amount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${data.paymentLink ? `
            <!-- Payment Button -->
            <table align="center" style="margin:24px 0;">
              <tr>
                <td style="background:#10b981; border-radius:8px;">
                  <a href="${data.paymentLink}" 
                     style="display:inline-block; padding:14px 28px; color:#ffffff;
                            font-weight:600; text-decoration:none;">
                    💳 Pay Now
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}

            ${data.notes ? `
            <!-- Notes -->
            <div style="background:#fef3c7; border-radius:8px; padding:16px; margin:24px 0;">
              <h4 style="margin:0 0 8px; color:#92400e; font-size:14px;">Notes:</h4>
              <p style="margin:0; color:#92400e; font-size:13px; line-height:1.5;">${data.notes}</p>
            </div>
            ` : ''}

            <!-- Footer Message -->
            <div style="text-align:center; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#374151; font-size:14px;">
                Thank you for your business! 🙏
              </p>
              <p style="margin:0; color:#6b7280; font-size:13px;">
                If you have any questions about this invoice, please contact us.
              </p>
            </div>

            <!-- App Link -->
            <table align="center" style="margin-top:20px;">
              <tr>
                <td style="background:#4f46e5; border-radius:6px;">
                  <a href="${data.appUrl}" 
                     style="display:inline-block; padding:10px 20px; color:#ffffff;
                            font-size:13px; text-decoration:none;">
                    View in ExpoInvoice
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px; background:#f9fafb; text-align:center; font-size:12px; color:#9ca3af;">
            © ${new Date().getFullYear()} ExpoInvoice. All rights reserved.<br/>
            This invoice was generated automatically by ExpoInvoice.
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>
`;
}