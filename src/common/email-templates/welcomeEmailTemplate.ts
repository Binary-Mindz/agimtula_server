export function welcomeEmailTemplate(data: {
  name: string;
  appUrl: string;
  logoUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to ExpoInvoice</title>
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
              Welcome to ExpoInvoice 🎉
            </h2>

            <p style="color:#4b5563; font-size:15px; line-height:1.7;">
              Hi <strong>${data.name}</strong>,<br/><br/>
              We’re excited to have you on board! ExpoInvoice helps you create,
              manage, and send invoices & quotations — fast and professionally.
            </p>

            <table width="100%" style="background:#f9fafb; border-radius:10px; padding:20px; margin:24px 0;">
              <tr>
                <td style="font-size:14px; color:#374151;">
                  ✅ Create invoices & quotations<br/>
                  ✅ Track payments easily<br/>
                  ✅ Automate email & invoice imports<br/>
                  ✅ Track Bank Transactions<br/>
                  ✅ Professional layouts & branding
                </td>
              </tr>
            </table>

            <table align="center">
              <tr>
                <td style="background:#4f46e5; border-radius:8px;">
                  <a href="${data.appUrl}"
                     style="display:inline-block; padding:14px 28px; color:#ffffff;
                            font-weight:600; text-decoration:none;">
                    Go to Website
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin-top:24px; font-size:14px; color:#6b7280; text-align:center;">
              If you need any help, just reply to this email — we’ve got you.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px; background:#f9fafb; text-align:center;
                     font-size:12px; color:#9ca3af;">
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
