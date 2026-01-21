export function otpEmailTemplate(data: {
  name: string;
  otp: string;
  purpose: string;
  appUrl: string;
  logoUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${data.purpose} OTP</title>
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
              ${data.purpose} Verification Code
            </h2>

            <p style="color:#4b5563; font-size:15px; line-height:1.7;">
              Hi <strong>${data.name}</strong>,<br/><br/>
              Use the following code to ${data.purpose.toLowerCase()} in your account. This code is valid for the next 5 minutes.
            </p>

            <table width="100%" style="background:#f9fafb; border-radius:10px; padding:20px; margin:24px 0; text-align:center;">
              <tr>
                <td style="font-size:24px; font-weight:700; color:#111827; letter-spacing:2px;">
                  ${data.otp}
                </td>
              </tr>
            </table>

            <p style="margin-top:24px; font-size:14px; color:#6b7280;">
              If you did not request this, you can safely ignore this email.
            </p>

            <table align="center" style="margin-top:16px;">
              <tr>
                <td style="background:#4f46e5; border-radius:8px;">
                  <a href="${data.appUrl}" 
                     style="display:inline-block; padding:14px 28px; color:#ffffff;
                            font-weight:600; text-decoration:none;">
                    Go to App
                  </a>
                </td>
              </tr>
            </table>

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
