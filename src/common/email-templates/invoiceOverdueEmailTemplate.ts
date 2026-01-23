export function invoiceOverdueEmailTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  daysOverdue: number;
  companyName: string;
  paymentLink?: string;
  appUrl: string;
  logoUrl: string;
}) {
  const formatDate = (date: Date) => date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formatCurrency = (amount: number) => `${data.currency} ${amount.toFixed(2)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Overdue - Invoice ${data.invoiceNumber}</title>
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
                  <div style="background:#dc2626; color:#ffffff; padding:8px 16px; border-radius:20px; font-size:12px; font-weight:600;">
                    ⚠️ OVERDUE
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <div style="text-align:center; margin-bottom:32px;">
              <div style="background:#dc2626; width:64px; height:64px; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                <span style="color:#ffffff; font-size:24px;">⚠️</span>
              </div>
              <h2 style="margin:0 0 8px; color:#dc2626; font-size:24px;">
                Payment Overdue
              </h2>
              <p style="margin:0; color:#6b7280; font-size:16px;">
                Invoice #${data.invoiceNumber} is ${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''} overdue
              </p>
            </div>

            <p style="color:#4b5563; font-size:15px; line-height:1.7; margin-bottom:24px;">
              Hi <strong>${data.clientName}</strong>,<br/><br/>
              We hope this email finds you well. We wanted to remind you that payment for Invoice #${data.invoiceNumber} 
              was due on ${formatDate(data.dueDate)} and is now <strong>${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''} overdue</strong>.
            </p>

            <!-- Invoice Details -->
            <table width="100%" style="background:#fef2f2; border-radius:10px; padding:20px; margin:24px 0; border:1px solid #fecaca;">
              <tr>
                <td style="color:#991b1b; font-weight:600; font-size:16px; padding-bottom:12px;">
                  Outstanding Payment
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%">
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Invoice Number:</td>
                      <td align="right" style="font-weight:600; padding:4px 0;">#${data.invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Amount Due:</td>
                      <td align="right" style="font-weight:700; font-size:18px; color:#dc2626; padding:4px 0;">
                        ${formatCurrency(data.amount)}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Due Date:</td>
                      <td align="right" style="font-weight:600; padding:4px 0;">${formatDate(data.dueDate)}</td>
                    </tr>
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Days Overdue:</td>
                      <td align="right" style="font-weight:700; color:#dc2626; padding:4px 0;">
                        ${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Status:</td>
                      <td align="right">
                        <span style="background:#dc2626; color:#ffffff; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600;">
                          OVERDUE
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Urgent Action Required -->
            <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px 20px; margin:24px 0;">
              <h3 style="margin:0 0 8px; color:#92400e; font-size:16px;">
                ⏰ Immediate Action Required
              </h3>
              <p style="margin:0; color:#92400e; font-size:14px; line-height:1.5;">
                To avoid any service interruption or late fees, please settle this payment immediately.
              </p>
            </div>

            ${data.paymentLink ? `
            <!-- Payment Button -->
            <table align="center" style="margin:32px 0;">
              <tr>
                <td style="background:#dc2626; border-radius:8px;">
                  <a href="${data.paymentLink}" 
                     style="display:inline-block; padding:16px 32px; color:#ffffff;
                            font-weight:700; text-decoration:none; font-size:16px;">
                    💳 Pay Now - ${formatCurrency(data.amount)}
                  </a>
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Alternative Payment Methods -->
            <div style="background:#f9fafb; border-radius:8px; padding:20px; margin:24px 0;">
              <h3 style="margin:0 0 12px; color:#374151; font-size:16px;">
                Payment Options:
              </h3>
              <ul style="margin:0; padding-left:20px; color:#6b7280; font-size:14px; line-height:1.6;">
                <li>Online payment via the link above</li>
                <li>Bank transfer to our account details</li>
                <li>Contact us to discuss payment arrangements</li>
              </ul>
            </div>

            <!-- Contact Information -->
            <div style="text-align:center; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#374151; font-size:14px;">
                Questions about this invoice or need to discuss payment terms?
              </p>
              <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">
                Contact us immediately at <strong>support@expoinvoice.com</strong> or reply to this email.
              </p>
              
              <table align="center">
                <tr>
                  <td style="background:#4f46e5; border-radius:6px; margin-right:8px;">
                    <a href="${data.appUrl}/invoices/${data.invoiceNumber}" 
                       style="display:inline-block; padding:10px 20px; color:#ffffff;
                              font-size:13px; text-decoration:none; font-weight:600;">
                      📄 View Invoice
                    </a>
                  </td>
                  <td style="background:#f3f4f6; border-radius:6px; border:1px solid #d1d5db;">
                    <a href="mailto:support@expoinvoice.com" 
                       style="display:inline-block; padding:10px 20px; color:#374151;
                              font-size:13px; text-decoration:none;">
                      📧 Contact Support
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Late Fee Warning -->
            <div style="background:#fef2f2; border-radius:8px; padding:16px; margin:24px 0; text-align:center; border:1px solid #fecaca;">
              <p style="margin:0; color:#991b1b; font-size:13px; font-weight:600;">
                ⚠️ Late fees may apply for payments received after ${data.daysOverdue + 7} days overdue
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px; background:#f9fafb; text-align:center; font-size:12px; color:#9ca3af;">
            © ${new Date().getFullYear()} ExpoInvoice. All rights reserved.<br/>
            This is an automated payment reminder. Please disregard if payment has already been made.
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