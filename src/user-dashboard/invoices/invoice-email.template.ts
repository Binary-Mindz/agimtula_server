/* eslint-disable @typescript-eslint/no-unsafe-argument */
export function invoiceEmailTemplate(invoice: any) {
  const itemsHtml = invoice.serviceAndItems
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${item.description}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;">${item.qty}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.rate}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${item.totalAmount}</td>
      </tr>
    `,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoiceNo}</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f6f6f6;padding:20px;">
  <div style="max-width:700px;margin:auto;background:#ffffff;padding:20px;border-radius:8px;">
    
    <h2 style="margin-bottom:5px;">Invoice</h2>
    <p style="color:#666;">Invoice No: <strong>${invoice.invoiceNo}</strong></p>

    <hr />

    <table width="100%" style="margin-bottom:20px;">
      <tr>
        <td>
          <strong>Billed To:</strong><br />
          ${invoice.companyName}<br />
          ${invoice.AddressAndContactInfo}<br />
          ${invoice.email}
        </td>
        <td align="right">
          <strong>Issue Date:</strong> ${new Date(invoice.issueDate).toDateString()}<br />
          <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toDateString() : '-'}
        </td>
      </tr>
    </table>

    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f0f0f0;">
          <th style="padding:8px;border:1px solid #ddd;text-align:left;">Description</th>
          <th style="padding:8px;border:1px solid #ddd;">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;">Rate</th>
          <th style="padding:8px;border:1px solid #ddd;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table width="100%" style="margin-top:20px;">
      <tr>
        <td></td>
        <td width="250">
          <table width="100%">
            <tr>
              <td>Subtotal</td>
              <td align="right">${invoice.subTotal}</td>
            </tr>
            <tr>
              <td>Tax (%)</td>
              <td align="right">${invoice.tax}</td>
            </tr>
            <tr>
              <td><strong>Total</strong></td>
              <td align="right"><strong>${invoice.totalAmount}</strong></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <hr />

    <p style="margin-top:10px;">
      <strong>Note:</strong><br />
      ${invoice.additionalNote || 'Thank you for your business.'}
    </p>

    ${
      invoice.mobilePaymentLink
        ? `<p>
            <a href="${invoice.mobilePaymentLink}" 
               style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">
               Pay Now
            </a>
          </p>`
        : ''
    }

    <p style="color:#999;font-size:12px;margin-top:30px;">
      This is a system-generated invoice.
    </p>

  </div>
</body>
</html>
`;
}
