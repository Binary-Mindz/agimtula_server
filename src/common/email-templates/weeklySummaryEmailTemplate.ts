export function weeklySummaryEmailTemplate(data: {
  userName: string;
  weekPeriod: string;
  
  // Invoice metrics
  invoicesCreated: number;
  invoicesSent: number;
  invoicesPaid: number;
  totalInvoiceAmount: number;
  pendingInvoices: number;
  overdueInvoices: number;
  
  // Financial metrics
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  // Expense breakdown
  receiptExpenses: number;
  mileageExpenses: number;
  totalMileage: number;
  
  // Activity highlights
  recentActivities: Array<{
    type: string;
    title: string;
    amount?: number;
    timeAgo: string;
  }>;
  
  // Comparisons
  revenueChange: number; // percentage
  expenseChange: number; // percentage
  
  // Recommendations
  recommendations: string[];
  
  // System info
  currency: string;
  appUrl: string;
  logoUrl: string;
}) {
  const formatCurrency = (amount: number) => `${data.currency} ${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getChangeColor = (value: number) => value >= 0 ? '#10b981' : '#dc2626';
  const getChangeIcon = (value: number) => value >= 0 ? '📈' : '📉';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Business Summary - ${data.weekPeriod}</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
  <tr>
    <td align="center">
      <table width="650" style="background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,.06);">

        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px; background:linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius:12px 12px 0 0;">
            <table width="100%">
              <tr>
                <td>
                  <img src="${data.logoUrl}" alt="ExpoInvoice" style="height:36px; filter:brightness(0) invert(1);" />
                </td>
                <td align="right">
                  <div style="color:#ffffff; font-size:14px; font-weight:600;">
                    📊 Weekly Summary
                  </div>
                </td>
              </tr>
            </table>
            <div style="margin-top:20px;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700;">
                Your Business This Week
              </h1>
              <p style="margin:8px 0 0; color:#e0e7ff; font-size:16px;">
                ${data.weekPeriod} • Hi ${data.userName}! 👋
              </p>
            </div>
          </td>
        </tr>

        <!-- Key Metrics -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 20px; color:#111827; font-size:20px;">
              📈 Key Performance Metrics
            </h2>
            
            <table width="100%" style="margin-bottom:32px;">
              <tr>
                <td width="50%" style="padding-right:16px;">
                  <!-- Revenue Card -->
                  <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:20px; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <p style="margin:0; color:#166534; font-size:14px; font-weight:600;">Total Revenue</p>
                        <h3 style="margin:4px 0 0; color:#166534; font-size:24px; font-weight:700;">
                          ${formatCurrency(data.totalRevenue)}
                        </h3>
                      </div>
                      <div style="color:${getChangeColor(data.revenueChange)}; font-size:12px; font-weight:600;">
                        ${getChangeIcon(data.revenueChange)} ${formatPercentage(data.revenueChange)}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Expenses Card -->
                  <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:20px;">
                    <div style="display:flex; align-items:center; justify-content:space-between;">
                      <div>
                        <p style="margin:0; color:#991b1b; font-size:14px; font-weight:600;">Total Expenses</p>
                        <h3 style="margin:4px 0 0; color:#991b1b; font-size:24px; font-weight:700;">
                          ${formatCurrency(data.totalExpenses)}
                        </h3>
                      </div>
                      <div style="color:${getChangeColor(-data.expenseChange)}; font-size:12px; font-weight:600;">
                        ${getChangeIcon(-data.expenseChange)} ${formatPercentage(data.expenseChange)}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td width="50%" style="padding-left:16px;">
                  <!-- Net Profit Card -->
                  <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:20px; margin-bottom:16px;">
                    <div>
                      <p style="margin:0; color:#1e40af; font-size:14px; font-weight:600;">Net Profit</p>
                      <h3 style="margin:4px 0 8px; color:#1e40af; font-size:24px; font-weight:700;">
                        ${formatCurrency(data.netProfit)}
                      </h3>
                      <div style="background:#1e40af; height:4px; border-radius:2px; width:${Math.min(100, Math.max(10, (data.netProfit / data.totalRevenue) * 100))}%;"></div>
                    </div>
                  </div>
                  
                  <!-- Invoice Status -->
                  <div style="background:#fefce8; border:1px solid #fde047; border-radius:10px; padding:20px;">
                    <p style="margin:0 0 8px; color:#a16207; font-size:14px; font-weight:600;">Invoice Status</p>
                    <div style="font-size:13px; color:#a16207;">
                      <div style="margin:2px 0;">✅ Paid: ${data.invoicesPaid}</div>
                      <div style="margin:2px 0;">⏳ Pending: ${data.pendingInvoices}</div>
                      <div style="margin:2px 0;">⚠️ Overdue: ${data.overdueInvoices}</div>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Invoice Activity -->
            <h2 style="margin:32px 0 20px; color:#111827; font-size:20px;">
              📄 Invoice Activity
            </h2>
            
            <table width="100%" style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:32px;">
              <tr>
                <td width="25%" style="text-align:center; padding:8px;">
                  <div style="color:#4f46e5; font-size:24px; font-weight:700;">${data.invoicesCreated}</div>
                  <div style="color:#6b7280; font-size:12px;">Created</div>
                </td>
                <td width="25%" style="text-align:center; padding:8px;">
                  <div style="color:#10b981; font-size:24px; font-weight:700;">${data.invoicesSent}</div>
                  <div style="color:#6b7280; font-size:12px;">Sent</div>
                </td>
                <td width="25%" style="text-align:center; padding:8px;">
                  <div style="color:#059669; font-size:24px; font-weight:700;">${data.invoicesPaid}</div>
                  <div style="color:#6b7280; font-size:12px;">Paid</div>
                </td>
                <td width="25%" style="text-align:center; padding:8px;">
                  <div style="color:#4f46e5; font-size:24px; font-weight:700;">${formatCurrency(data.totalInvoiceAmount)}</div>
                  <div style="color:#6b7280; font-size:12px;">Total Value</div>
                </td>
              </tr>
            </table>

            <!-- Expense Breakdown -->
            <h2 style="margin:32px 0 20px; color:#111827; font-size:20px;">
              💰 Expense Breakdown
            </h2>
            
            <table width="100%" style="margin-bottom:32px;">
              <tr>
                <td width="50%" style="padding-right:8px;">
                  <div style="background:#f3f4f6; border-radius:8px; padding:16px; text-align:center;">
                    <div style="color:#374151; font-size:18px; font-weight:700;">${formatCurrency(data.receiptExpenses)}</div>
                    <div style="color:#6b7280; font-size:13px;">Receipt Expenses</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px;">
                  <div style="background:#f3f4f6; border-radius:8px; padding:16px; text-align:center;">
                    <div style="color:#374151; font-size:18px; font-weight:700;">${formatCurrency(data.mileageExpenses)}</div>
                    <div style="color:#6b7280; font-size:13px;">Mileage (${data.totalMileage} km)</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Recent Activities -->
            <h2 style="margin:32px 0 20px; color:#111827; font-size:20px;">
              🎯 Recent Activities
            </h2>
            
            <div style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:32px;">
              ${data.recentActivities.slice(0, 5).map(activity => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #e5e7eb;">
                  <div>
                    <div style="color:#374151; font-size:14px; font-weight:600;">${activity.title}</div>
                    <div style="color:#6b7280; font-size:12px;">${activity.timeAgo}</div>
                  </div>
                  ${activity.amount ? `<div style="color:#4f46e5; font-weight:600;">${formatCurrency(activity.amount)}</div>` : ''}
                </div>
              `).join('')}
            </div>

            ${data.recommendations.length > 0 ? `
            <!-- Recommendations -->
            <h2 style="margin:32px 0 20px; color:#111827; font-size:20px;">
              💡 Recommendations
            </h2>
            
            <div style="background:#fef3c7; border-radius:10px; padding:20px; margin-bottom:32px;">
              ${data.recommendations.map(rec => `
                <div style="margin:8px 0; color:#92400e; font-size:14px; line-height:1.5;">
                  • ${rec}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <!-- Action Buttons -->
            <table width="100%" style="margin:32px 0;">
              <tr>
                <td align="center">
                  <table>
                    <tr>
                      <td style="background:#4f46e5; border-radius:8px; margin-right:12px;">
                        <a href="${data.appUrl}/dashboard" 
                           style="display:inline-block; padding:14px 24px; color:#ffffff;
                                  font-weight:600; text-decoration:none; font-size:14px;">
                          📊 View Dashboard
                        </a>
                      </td>
                      <td style="background:#10b981; border-radius:8px; margin-right:12px;">
                        <a href="${data.appUrl}/invoices/create" 
                           style="display:inline-block; padding:14px 24px; color:#ffffff;
                                  font-weight:600; text-decoration:none; font-size:14px;">
                          ➕ Create Invoice
                        </a>
                      </td>
                      <td style="background:#f59e0b; border-radius:8px;">
                        <a href="${data.appUrl}/reports" 
                           style="display:inline-block; padding:14px 24px; color:#ffffff;
                                  font-weight:600; text-decoration:none; font-size:14px;">
                          📈 View Reports
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Footer Message -->
            <div style="text-align:center; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 8px; color:#374151; font-size:14px;">
                Keep up the great work! 🚀
              </p>
              <p style="margin:0; color:#6b7280; font-size:13px;">
                Questions? Reply to this email or contact support@expoinvoice.com
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px; background:#f9fafb; text-align:center; font-size:12px; color:#9ca3af; border-radius:0 0 12px 12px;">
            © ${new Date().getFullYear()} ExpoInvoice. All rights reserved.<br/>
            This weekly summary was generated automatically. 
            <a href="${data.appUrl}/settings/notifications" style="color:#4f46e5; text-decoration:none;">Manage email preferences</a>
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