import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from './generated/prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';


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
    throw new Error(
      '❌ SUPER_ADMIN_* environment variables must be set.',
    );
  }

  const existing = await prisma.email.findFirst({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existing) {
    console.log('⚠️ Super Admin already exists. Skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@12A', 10);

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
    { name: 'bank_integration_monitor', displayName: 'Bank Integration Monitor' },
    { name: 'eu_invoice', displayName: 'EU Invoice' },
    { name: 'overview', displayName: 'Overview' },
    { name: 'clients', displayName: 'Clients Management' },
    { name: 'purchases', displayName: 'Purchases Management' },
    { name: 'sales_invoices', displayName: 'Sales Invoices' },
    { name: 'expenses', displayName: 'Receipts / Expenses' },
    { name: 'vat_overview', displayName: 'VAT Overview' },
  ];



  for (const mod of modules) {
    await prisma.module.upsert({
      where: { name: mod.name },
      create: mod,
      update: mod,
    });
  }

  console.log('✅ Modules & Permissions seeded successfully');
}


async function main() {
  console.log('🚀 Seeding started...');

  await seedSuperAdmin();
  await seedPermissions();

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
