# IMAP System Monitor WebSocket Documentation

## Overview
Real-time WebSocket connection for monitoring invoice imports from IMAP email sync.

## Connection Details

### Endpoint
```
http://localhost:3000/imap-monitor
```

### Namespace
`/imap-monitor`

## Events

### 1. `invoice-import`
Emitted when a new invoice is imported via IMAP email sync.

#### Event Data Structure
```typescript
{
  id: string;           // Invoice ID
  userName: string;     // User's full name
  userEmail: string;    // User's email address
  status: 'success' | 'error';  // Import status
  timestamp: Date;      // Import timestamp
}
```

#### Example Payload
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "status": "success",
  "timestamp": "2026-01-17T10:30:00.000Z"
}
```

## Client Implementation

### React Example
```typescript
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function ImapMonitor() {
  const [imports, setImports] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:3000/imap-monitor');

    socket.on('invoice-import', (data) => {
      setImports(prev => [data, ...prev].slice(0, 10));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      {imports.map(imp => (
        <div key={imp.id}>
          {imp.userName} - {imp.status}
        </div>
      ))}
    </div>
  );
}
```

