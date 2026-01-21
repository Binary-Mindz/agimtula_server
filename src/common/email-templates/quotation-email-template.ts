export function quotationEmailTemplate(data: {
  clientName: string;
  amount: number;
  quotationId: string;
  date: Date;
  appUrl: string;
  logoUrl: string;
}) {
  const formattedDate = data.date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Quotation</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
  <tr>
    <td align="center">
      <table width="600" style="background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.06);">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px; border-bottom:1px solid #eef1f6;">
            <img src="${data.logoUrl}" alt="ExpoInvoice" style="height:36px;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 12px; color:#111827;">
              You've received a new quotation
            </h2>

            <p style="color:#4b5563; font-size:15px; line-height:1.6;">
              Hi <strong>${data.clientName}</strong>,<br/><br/>
              A new quotation has been created for you. Please review the details below.
            </p>

            <table width="100%" style="background:#f9fafb; border-radius:10px; padding:20px; margin:20px 0;">
              <tr>
                <td style="color:#6b7280;">Quotation ID</td>
                <td align="right" style="font-weight:600;">${data.quotationId}</td>
              </tr>
              <tr>
                <td style="color:#6b7280; padding-top:8px;">Amount</td>
                <td align="right" style="font-weight:700; font-size:16px; padding-top:8px;">
                  ${data.amount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style="color:#6b7280; padding-top:8px;">Date</td>
                <td align="right" style="padding-top:8px;">${formattedDate}</td>
              </tr>
            </table>

           

            <p style="margin-top:24px; font-size:13px; color:#6b7280; text-align:center;">
              If you have any questions, feel free to reply to this email.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px; background:#f9fafb; text-align:center; font-size:12px; color:#9ca3af;">
            © ${new Date().getFullYear()} ExpoInvoice. All rights reserved.
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
