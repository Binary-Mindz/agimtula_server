# 🎯 Role-Based Permission System - Implementation Guide

## ✅ কি বাস্তবায়ন করা হয়েছে

আপনার permission system সম্পূর্ণভাবে user-based থেকে **role-based** এ রূপান্তরিত হয়েছে।

### 📊 Database Schema
```
┌─────────────────────────────────────────┐
│          RoleModulePermission            │
├─────────────────────────────────────────┤
│ id                  (UUID)               │
│ role                (UserRole: ENUM)     │ ← ADMIN/USER/ACCOUNTANT
│ moduleId            (FK → Module)        │
│ isEnabled           (Boolean)            │
│ grantedBy           (String, optional)   │
│ createdAt/updatedAt (Timestamps)        │
└─────────────────────────────────────────┘
         ↓ ↓ ↓
    ℝ one-to-Many
         ↓ ↓ ↓
┌─────────────────────────────────────────┐
│             Module                      │
├─────────────────────────────────────────┤
│ id, name, displayName, description      │
│ isActive, createdAt, updatedAt          │
└─────────────────────────────────────────┘
```

### 📁 নতুন ফাইল

1. **[permission.guard.ts](src/auth/guard/permission.guard.ts)** - Role-based permission guard
2. **[role-permission.prisma](prisma/schema/module.prisma)** - RoleModulePermission model

---

## 🚀 কিভাবে ব্যবহার করবেন

### 1️⃣ Admin থেকে Role-এ Permission দিন

```bash
POST /permissions/roles/{role}/modules/{moduleName}/assign

Example:
POST /permissions/roles/USER/modules/invoices/assign

Response:
{
  "success": true,
  "message": "Permission granted to USER role for invoices module",
  "data": {
    "id": "uuid",
    "role": "USER",
    "moduleId": "uuid",
    "isEnabled": true
  }
}
```

### 2️⃣ Role থেকে Permission রিভোক করুন

```bash
DELETE /permissions/roles/{role}/modules/{moduleName}/revoke

Example:
DELETE /permissions/roles/ACCOUNTANT/modules/users/revoke
```

### 3️⃣ একটি Role-এর সব Permissions দেখুন

```bash
GET /permissions/roles/{role}/modules

Example:
GET /permissions/roles/USER/modules

Response:
{
  "success": true,
  "message": "Permissions retrieved for USER role",
  "data": {
    "role": "USER",
    "permissions": [
      {
        "id": "uuid",
        "role": "USER",
        "module": {
          "name": "invoices",
          "displayName": "Invoices Management"
        },
        "isEnabled": true
      }
    ],
    "totalPermissions": 7
  }
}
```

### 4️⃣ সব Roles-এর সব Permissions দেখুন

```bash
GET /permissions/roles/all

Response:
{
  "success": true,
  "message": "All roles with permissions retrieved successfully",
  "data": [
    {
      "role": "ADMIN",
      "permissions": [...],
      "totalPermissions": 26
    },
    {
      "role": "USER",
      "permissions": [...],
      "totalPermissions": 7
    },
    {
      "role": "ACCOUNTANT",
      "permissions": [...],
      "totalPermissions": 7
    }
  ]
}
```

---

## 🛡️ Controllers-এ Guard ব্যবহার

### Option 1: Decorator সহ ModuleAccessGuard

```typescript
import { Controller, Get } from '@nestjs/common';
import { HasModuleAccess } from 'src/auth/decorators/module-access.decorator';
import { ModuleAccessGuard } from 'src/auth/guard/module-access.guard';
import { UseGuards } from '@nestjs/common';

@Controller('invoices')
@UseGuards(ModuleAccessGuard)
export class InvoicesController {
  
  @Get()
  @HasModuleAccess('invoices')  // ← Role-based permission check
  async getInvoices() {
    // User's role অবশ্যই 'invoices' module-এ permission থাকতে হবে
  }
}
```

### Option 2: PermissionGuard (Advanced)

```typescript
import { Controller, Get } from '@nestjs/common';
import { PermissionGuard, RequiredPermission } from 'src/auth/guard/permission.guard';
import { UseGuards } from '@nestjs/common';

@Controller('reports')
@UseGuards(PermissionGuard)
export class ReportsController {
  
  @Get()
  @RequiredPermission('reports')  // ← Role-based permission check
  async getReports() {
    // User's role অবশ্যই 'reports' module-এ permission থাকতে হবে
  }
}
```

---

## 📋 Default Role Permissions (Seeded)

### ADMIN Role
✅ **সব Modules-এ full access**
- quotations, receipts, users, reports, settings, invoices, dashboard
- auto_invoice_import, bank_transactions, mileage, imap_system_monitor
- subscriptions, modules, profile, system_settings, support, payments
- supplier_imports, bank_integration_monitor, eu_invoice, overview
- clients, purchases, sales_invoices, expenses, vat_overview

### USER Role
✅ **Basic user modules**
- dashboard, profile, invoices, receipts, quotations, mileage, reports

### ACCOUNTANT Role
✅ **Accountant-specific modules**
- dashboard, invoices, receipts, reports, bank_transactions, vat_overview, profile

---

## 🔄 Permission Check Flow

```
User Request
    ↓
AuthGuard (Role validation)
    ↓
ModuleAccessGuard (@HasModuleAccess decorator)
    ↓
Check User-Specific Permission ← Higher Priority
    ├─ Found & Enabled? → ALLOW
    └─ Not Found/Disabled → Check Role Permission
    ↓
Check Role-Based Permission
    ├─ Found & Enabled? → ALLOW
    └─ Not Found/Disabled → DENY (403 Forbidden)
```

---

## 📝 Service Methods

### PermissionService

#### Role-Based Methods:

```typescript
// 1. Role-এ permission assign করুন
async assignRolePermission(
  role: UserRole,
  moduleName: string,
  grantedBy: string
)

// 2. Role থেকে permission রিভোক করুন
async revokeRolePermission(
  role: UserRole,
  moduleName: string
)

// 3. একটি role-এর সব permissions দেখুন
async getRolePermissions(role: UserRole)

// 4. সব roles-এর সব permissions দেখুন
async getAllRolesWithPermissions()

// 5. একটি role-এর কাছে নির্দিষ্ট module-এর permission আছে কিনা চেক করুন
async hasRolePermission(
  role: UserRole,
  moduleName: string
): Promise<boolean>
```

#### User-Based Methods (Legacy - Backward Compatibility):

```typescript
// পুরোনো user-specific permission methods এখনও কাজ করছে:
- grantUserModuleAccess()
- revokeUserModuleAccess()
- getUserModules()
- getAllModules()
```

---

## ✨ Features

### ✅ Role-Based Access Control (RBAC)
- Admin সহজেই যেকোনো role-কে যেকোনো module-এর permission দিতে পারে
- 3টি predefined roles: ADMIN, USER, ACCOUNTANT

### ✅ Flexible Permission Assignment
- Role level (সব users যাদের same role)
- User level (specific user কে override permission)

### ✅ Priority System
- User-specific permission > Role-based permission
- ADMIN role সবসময় সব modules-এ access পায়

### ✅ Database Transaction Safe
- Unique constraint: `(role, moduleId)`
- Cascade delete: module delete হলে permissions delete হয়

---

## 🧪 Testing Examples

### 1. USER Role-কে invoices permission দিন

```bash
curl -X POST http://localhost:3000/permissions/roles/USER/modules/invoices/assign \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. USER Role-এর সব permissions দেখুন

```bash
curl -X GET http://localhost:3000/permissions/roles/USER/modules \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Invoices endpoint access করুন (user হিসেবে)

```bash
curl -X GET http://localhost:3000/user-dashboard/invoices \
  -H "Authorization: Bearer USER_TOKEN"

# ✅ SUCCESS: if user's role has 'invoices' permission
# ❌ FORBIDDEN: if user's role doesn't have permission
```

---

## 🔧 Migration & Seed

সব কিছু ইতিমধ্যে migrate এবং seed হয়েছে:

```bash
# Migration চেক করুন
npx prisma migrate status

# আবার seed করতে চাইলে
npm run seed
```

---

## 📌 Important Notes

1. **ADMIN users**: সবসময় সব modules-এ access পায় - permission check bypass হয়

2. **User-specific overrides**: একজন USER-কে যদি ADMIN টেমপরারি permissions দিতে চান, তার জন্য user-specific permission সেট করুন

3. **Backward compatible**: পুরানো user-based permission API endpoints এখনও কাজ করে

4. **Default permissions**: Seed-এ ADMIN-কে সব permissions দেওয়া হয়েছে, এটি কাস্টমাইজ করতে পারেন

---

## 🚨 Troubleshooting

### ❌ "Access denied. USER role does not have permission"

**সমাধান**: Admin থেকে role-এ permission assign করুন:

```bash
POST /permissions/roles/USER/modules/{moduleName}/assign
```

### ❌ "Module not found"

**সমাধান**: নিশ্চিত করুন module name exact আছে:

```bash
GET /permissions/roles/all
# List থেকে exact module name copy করুন
```

### ❌ Permission সেটিংস apply হচ্ছে না

**সমাধান**: Database check করুন:

```bash
npx prisma studio
# role_module_permission table ওপেন করুন এবং verify করুন
```

---

## 📞 Summary

✨ আপনার permission system এখন **fully role-based**! 

👤 প্রতিটি user তার role-এর permissions ব্যবহার করে, যা admin সহজেই manage করতে পারে।

🎯 এখন থেকে:
- Admin → Role select করে → Module select করে → Permission assign/revoke করুন
- User automatically সেই permission পায় যখন তার role-এ সেটা add হয়

**Happy coding! 🚀**
