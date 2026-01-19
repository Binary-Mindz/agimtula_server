import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from './generated/prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { HttpException, HttpStatus } from '@nestjs/common';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('❌ DATABASE_URL must be set in environment variables.');
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: [{ emit: 'event', level: 'error' }],
  });
}

const prisma = createPrismaClient();

async function seedSuperAdmin() {
  const {
    SUPER_ADMIN_FIRSTNAME,
    SUPER_ADMIN_LASTNAME,
    SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD,
  } = process.env;

  if (
    !SUPER_ADMIN_FIRSTNAME ||
    !SUPER_ADMIN_LASTNAME ||
    !SUPER_ADMIN_EMAIL ||
    !SUPER_ADMIN_PASSWORD
  ) {
    throw new Error('❌ SUPER_ADMIN_* environment variables must be set.');
  }

  const existing = await prisma.email.findFirst({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    console.log('⚠️ Super Admin already exists. Skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('12345678', 10);

  await prisma.user.create({
    data: {
      profile: {
        create: {
          firstName: SUPER_ADMIN_FIRSTNAME,
          lastName: SUPER_ADMIN_LASTNAME,
        },
      },
      email: {
        create: {
          email: 'admin@gmail.com',
        },
      },
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Super Admin created successfully');
}

async function seedPermissions() {
  const modules = [
    { name: 'quotations', displayName: 'Quotations Management' },
    { name: 'receipts', displayName: 'Receipts Management' },
    { name: 'users', displayName: 'User Management' },
    { name: 'reports', displayName: 'Reports & Analytics' },
    { name: 'settings', displayName: 'Application Settings' },
    { name: 'invoices', displayName: 'Invoices Management' },
    { name: 'dashboard', displayName: 'Dashboard' },
    { name: 'auto_invoice_import', displayName: 'Auto Invoice Import' },
    { name: 'bank_transactions', displayName: 'Bank Transactions' },
    { name: 'mileage', displayName: 'Mileage Tracking' },
    { name: 'imap_system_monitor', displayName: 'IMAP System Monitor' },
    { name: 'subscriptions', displayName: 'Subscriptions' },
    { name: 'modules', displayName: 'Modules Management' },
    { name: 'profile', displayName: 'Profile Settings' },
    { name: 'system_settings', displayName: 'System Settings' },
    { name: 'support', displayName: 'Support' },
    { name: 'payments', displayName: 'Payments' },
    { name: 'supplier_imports', displayName: 'Supplier Imports' },
    {
      name: 'bank_integration_monitor',
      displayName: 'Bank Integration Monitor',
    },
    { name: 'eu_invoice', displayName: 'EU Invoice' },
    { name: 'overview', displayName: 'Overview' },
    { name: 'clients', displayName: 'Clients Management' },
    { name: 'purchases', displayName: 'Purchases Management' },
    { name: 'sales_invoices', displayName: 'Sales Invoices' },
    { name: 'expenses', displayName: 'Receipts / Expenses' },
    { name: 'vat_overview', displayName: 'VAT Overview' },
    { name: 'purchase_management', displayName: 'Purchase Management' }
  ];

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod.name },
      create: mod,
      update: mod,
    });
  }

  console.log('✅ Modules seeded successfully');
}

async function vatRules() {
  try {
    const vatRules = [
      { country: 'Netherlands', code: 'NL', standardRate: 0, reducedRate: 0 },
      { country: 'Belgium', code: 'BE', standardRate: 0, reducedRate: 0 },
      { country: 'Germany', code: 'DE', standardRate: 0, reducedRate: 0 },
      { country: 'France', code: 'FR', standardRate: 0, reducedRate: 0 },
    ];

    for (const rule of vatRules) {
      const existing = await prisma.vatRate.findFirst({
        where: { code: rule.code }
      });

      if (existing) {
        await prisma.vatRate.update({
          where: { id: existing.id },
          data: rule,
        });
      } else {
        await prisma.vatRate.create({
          data: rule,
        });
      }
    }

    console.log('✅ VAT rules seeded successfully');
  } catch (error) {
    if (error instanceof HttpException) {
      throw error
    }

    throw new HttpException("Failed to make vat rules",HttpStatus.INTERNAL_SERVER_ERROR)
  }
}

async function seedRolePermissions() {

  const allModules = await prisma.module.findMany();

  // ADMIN - সব modules এ access
  for (const module of allModules) {
    await prisma.roleModulePermission.upsert({
      where: {
        role_moduleId: {
          role: UserRole.ADMIN,
          moduleId: module.id,
        },
      },
      create: {
        role: UserRole.ADMIN,
        moduleId: module.id,
        isEnabled: true,
        grantedBy: 'system',
      },
      update: {
        isEnabled: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ Admin role permissions seeded successfully');

  // USER - basic modules এ access
  const userModules = [
    'dashboard',
    'profile',
    'invoices',
    'receipts',
    'quotations',
    'mileage',
    'reports',
  ];

  const userModuleObjects = allModules.filter((m) =>
    userModules.includes(m.name),
  );

  for (const module of userModuleObjects) {
    await prisma.roleModulePermission.upsert({
      where: {
        role_moduleId: {
          role: UserRole.USER,
          moduleId: module.id,
        },
      },
      create: {
        role: UserRole.USER,
        moduleId: module.id,
        isEnabled: true,
        grantedBy: 'system',
      },
      update: {
        isEnabled: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ User role permissions seeded successfully');

  // ACCOUNTANT - accountant specific modules
  const accountantModules = [
    'dashboard',
    'invoices',
    'receipts',
    'reports',
    'bank_transactions',
    'vat_overview',
    'profile',
    'purchase_management',
  ];

  const accountantModuleObjects = allModules.filter((m) =>
    accountantModules.includes(m.name),
  );

  for (const module of accountantModuleObjects) {
    await prisma.roleModulePermission.upsert({
      where: {
        role_moduleId: {
          role: UserRole.ACCOUNTANT,
          moduleId: module.id,
        },
      },
      create: {
        role: UserRole.ACCOUNTANT,
        moduleId: module.id,
        isEnabled: true,
        grantedBy: 'system',
      },
      update: {
        isEnabled: true,
        updatedAt: new Date(),
      },
    });
  }

  console.log('✅ Accountant role permissions seeded successfully');
}

async function main() {
  console.log('🚀 Seeding started...');

  await seedSuperAdmin();
  await seedPermissions();
  await vatRules();
  await seedRolePermissions();
  console.log('🎉 Seeding completed successfully');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
