# Invoice Import WebSocket Flow

## How `notifyInvoiceImport` Gets Called

### Flow Overview
```
IMAP Sync → New Invoice Created → WebSocket Notification → Admin Dashboard
```

### Step-by-Step Process

#### 1. IMAP Sync Triggered
Location: `src/user-dashboard/auto-invoice-imports/imap-sync.service.ts`

The sync can be triggered by:
- **Manual sync**: User clicks sync button
- **Automated cron job**: Based on user's sync interval (15min/hourly/daily)

```typescript
async syncEmails(userId: string): Promise<Invoice[]> {
  // ... sync logic
  const newInvoices = await this.imapApisService.readEmailTransactionsSince(
    userId,
    lastSyncDate,
  );
  // ...
}
```

#### 2. Invoices Created
When new invoices are found in the email:
- Invoices are created in the database
- User information is fetched (name, email)

#### 3. WebSocket Notification Sent
For each new invoice, the system calls:

```typescript
this.imapMonitor.notifyInvoiceImport({
  id: invoice.id,
  userName: `${user.profile.firstName} ${user.profile.lastName}`,
  userEmail: user.email.email,
  status: invoice.haveAttachment ? 'success' : 'error',
  timestamp: new Date(),
});
```

#### 4. Gateway Emits Event
Location: `src/admin-dashboard/imap-system-monitor/imap-system-monitor.service.ts`

```typescript
notifyInvoiceImport(invoiceData: any) {
  this.gateway.emitInvoiceImport(invoiceData);
}
```

#### 5. WebSocket Broadcast
Location: `src/admin-dashboard/imap-system-monitor/imap-system-monitor.gateway.ts`

```typescript
emitInvoiceImport(data: any) {
  this.server.emit('invoice-import', data);
}
```

#### 6. Admin Dashboard Receives
All connected admin clients listening to the `/imap-monitor` namespace receive the event in real-time.

## Module Dependencies

### AutoInvoiceImportsModule
```typescript
imports: [
  ImapApisModule,
  ActivityLogModule,
  ImapSystemMonitorModule  // ← Provides WebSocket functionality
]
```

### ImapSystemMonitorModule
```typescript
providers: [
  ImapSystemMonitorService,
  ImapSystemMonitorGateway  // ← WebSocket gateway
],
exports: [ImapSystemMonitorService]  // ← Exported for use in other modules
```

## Trigger Points

### 1. Manual Sync
```
User clicks "Sync Now" 
  → POST /auto-invoice-imports/sync
  → ImapSyncService.syncEmails()
  → WebSocket notification
```

### 2. Automated Sync (Cron)
```
Cron job runs (every 15min/hourly/daily)
  → CronConfigService triggers sync
  → ImapSyncService.syncEmails()
  → WebSocket notification
```

## Data Flow Diagram

```
┌─────────────────┐
│  User's Email   │
│   (IMAP Server) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  IMAP Sync      │
│  Service        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  New Invoice    │
│  Created in DB  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notify via     │
│  WebSocket      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Admin Dashboard│
│  (Real-time)    │
└─────────────────┘
```

## Testing the Flow

### 1. Setup WebSocket Connection
```typescript
const socket = io('ws://localhost:3000/imap-monitor');
socket.on('invoice-import', (data) => {
  console.log('New invoice:', data);
});
```

### 2. Trigger a Sync
- Login as a user with IMAP configured
- Click "Sync Now" button
- Or wait for automated cron job

### 3. Observe Real-time Updates
- Admin dashboard receives instant notification
- No page refresh needed
- Shows: user name, email, status, timestamp

## Error Handling

If sync fails:
- No WebSocket notification sent
- Error logged to ActivityLog
- Sync history updated with error status

## Performance Notes

- WebSocket notifications are sent **per invoice**
- If 10 invoices are synced, 10 separate events are emitted
- This allows real-time updates as each invoice is processed
- Admin dashboard can show a live feed of imports
