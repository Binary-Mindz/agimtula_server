export function invoicePaidEmailTemplate(data: {
  clientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod?: string;
  companyName: string;
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
  <title>Payment Received - Invoice ${data.invoiceNumber}</title>
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
                  <div style="background:#10b981; color:#ffffff; padding:8px 16px; border-radius:20px; font-size:12px; font-weight:600;">
                    ✓ PAID
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
              <div style="background:#10b981; width:64px; height:64px; border-radius:50%; margin:0 auto 16px; display:flex; align-items:center; justify-content:center;">
                <span style="color:#ffffff; font-size:24px;">✓</span>
              </div>
              <h2 style="margin:0 0 8px; color:#111827; font-size:24px;">
                Payment Received!
              </h2>
              <p style="margin:0; color:#6b7280; font-size:16px;">
                Thank you for your payment
              </p>
            </div>

            <p style="color:#4b5563; font-size:15px; line-height:1.7; margin-bottom:24px;">
              Hi <strong>${data.clientName}</strong>,<br/><br/>
              We've successfully received your payment for Invoice #${data.invoiceNumber}. 
              Your invoice has been marked as paid and a receipt has been generated.
            </p>

            <!-- Payment Details -->
            <table width="100%" style="background:#f0fdf4; border-radius:10px; padding:20px; margin:24px 0; border:1px solid #bbf7d0;">
              <tr>
                <td style="color:#166534; font-weight:600; font-size:16px; padding-bottom:12px;">
                  Payment Details
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
                      <td style="color:#374151; padding:4px 0;">Amount Paid:</td>
                      <td align="right" style="font-weight:700; font-size:18px; color:#10b981; padding:4px 0;">
                        ${formatCurrency(data.amount)}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Payment Date:</td>
                      <td align="right" style="font-weight:600; padding:4px 0;">${formatDate(data.paymentDate)}</td>
                    </tr>
                    ${data.paymentMethod ? `
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Payment Method:</td>
                      <td align="right" style="font-weight:600; padding:4px 0;">${data.paymentMethod}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="color:#374151; padding:4px 0;">Status:</td>
                      <td align="right">
                        <span style="background:#10b981; color:#ffffff; padding:4px 8px; border-radius:12px; font-size:12px; font-weight:600;">
                          PAID
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Action Buttons -->
            <table width="100%" style="margin:32px 0;">
              <tr>
                <td align="center">
                  <table>
                    <tr>
                      <td style="background:#4f46e5; border-radius:8px; margin-right:12px;">
                        <a href="${data.appUrl}/invoices" 
                           style="display:inline-block; padding:12px 24px; color:#ffffff;
                                  font-weight:600; text-decoration:none; font-size:14px;">
                          📄 View Invoice
                        </a>
                      </td>
                      <td style="background:#10b981; border-radius:8px;">
                        <a href="${data.appUrl}/receipts" 
                           style="display:inline-block; padding:12px 24px; color:#ffffff;
                                  font-weight:600; text-decoration:none; font-size:14px;">
                          🧾 Download Receipt
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Thank You Message -->
            <div style="background:#fef3c7; border-radius:8px; padding:20px; margin:24px 0; text-align:center;">
              <h3 style="margin:0 0 8px; color:#92400e; font-size:16px;">
                🙏 Thank You for Your Business!
              </h3>
              <p style="margin:0; color:#92400e; font-size:14px; line-height:1.5;">
                We appreciate your prompt payment and look forward to working with you again.
              </p>
            </div>

            <!-- Footer Message -->
            <div style="text-align:center; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#374151; font-size:14px;">
                Need help or have questions about this payment?
              </p>
              <p style="margin:0; color:#6b7280; font-size:13px;">
                Contact us at support@expoinvoice.com or reply to this email.
              </p>
            </div>

            <!-- App Link -->
            <table align="center" style="margin-top:20px;">
              <tr>
                <td style="background:#f3f4f6; border-radius:6px; border:1px solid #d1d5db;">
                  <a href="${data.appUrl}" 
                     style="display:inline-block; padding:10px 20px; color:#374151;
                            font-size:13px; text-decoration:none;">
                    Go to ExpoInvoice Dashboard
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
            This payment confirmation was generated automatically.
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