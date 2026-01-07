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


async function seedFinancialDocuments() {
  const documents = [
    // Credit Notes
    {
      documentType: "credit_note",
      documentNumber: "CRN-202510-501",
      documentDate: new Date("2025-10-09"),
      supplierName: "Bol.com B.V.",
      supplierVatNumber: "NL001234567B01",
      supplierCountry: "NL",
      items: [
        {
          description: "Retour/Correctie",
          quantity: 1,
          unitPriceExVat: -66.99,
          vatRatePercent: 21,
          vatAmount: -14.07,
          totalExVat: -66.99
        }
      ],
      subtotalExVat: -66.99,
      totalVat: -14.07,
      grandTotalInclVat: -81.06,
      paymentMethod: "bank_transfer",
      isPaid: true,
      currency: "EUR",
      note: "Creditnota vermindert openstaande kosten",
      isTestData: true
    },
    {
      documentType: "credit_note",
      documentNumber: "CRN-202511-112",
      documentDate: new Date("2025-11-03"),
      supplierName: "Amazon EU Sarl",
      supplierVatNumber: "LU26375245",
      supplierCountry: "LU",
      items: [
        {
          description: "Returned Electronics Item",
          quantity: 1,
          unitPriceExVat: -120.00,
          vatRatePercent: 20,
          vatAmount: -24.00,
          totalExVat: -120.00
        }
      ],
      subtotalExVat: -120.00,
      totalVat: -24.00,
      grandTotalInclVat: -144.00,
      paymentMethod: "card_refund",
      isPaid: true,
      currency: "EUR",
      isTestData: true
    },
    {
      documentType: "credit_note",
      documentNumber: "CRN-202509-778",
      documentDate: new Date("2025-09-21"),
      supplierName: "Office Depot NL",
      supplierVatNumber: "NL998877665B01",
      supplierCountry: "NL",
      items: [
        {
          description: "Office Chair Return",
          quantity: 1,
          unitPriceExVat: -89.50,
          vatRatePercent: 21,
          vatAmount: -18.80,
          totalExVat: -89.50
        }
      ],
      subtotalExVat: -89.50,
      totalVat: -18.80,
      grandTotalInclVat: -108.30,
      paymentMethod: "bank_transfer",
      isPaid: true,
      currency: "EUR",
      isTestData: true
    },
    {
      documentType: "credit_note",
      documentNumber: "CRN-202512-045",
      documentDate: new Date("2025-12-05"),
      supplierName: "Daraz Bangladesh",
      supplierVatNumber: "BD556677889",
      supplierCountry: "BD",
      items: [
        {
          description: "Cancelled Order Refund",
          quantity: 1,
          unitPriceExVat: -1500,
          vatRatePercent: 7.5,
          vatAmount: -112.5,
          totalExVat: -1500
        }
      ],
      subtotalExVat: -1500,
      totalVat: -112.5,
      grandTotalInclVat: -1612.5,
      paymentMethod: "mobile_banking_refund",
      isPaid: true,
      currency: "BDT",
      isTestData: true
    },
    {
      documentType: "credit_note",
      documentNumber: "CRN-202508-301",
      documentDate: new Date("2025-08-14"),
      supplierName: "Uber BV",
      supplierVatNumber: "NL852369874B01",
      supplierCountry: "NL",
      items: [
        {
          description: "Trip Fare Adjustment",
          quantity: 1,
          unitPriceExVat: -18.75,
          vatRatePercent: 9,
          vatAmount: -1.69,
          totalExVat: -18.75
        }
      ],
      subtotalExVat: -18.75,
      totalVat: -1.69,
      grandTotalInclVat: -20.44,
      paymentMethod: "wallet_refund",
      isPaid: true,
      currency: "EUR",
      isTestData: true
    },
    {
      documentType: "credit_note",
      documentNumber: "CRN-202511-909",
      documentDate: new Date("2025-11-28"),
      supplierName: "Foodpanda",
      supplierVatNumber: "BD223344556",
      supplierCountry: "BD",
      items: [
        {
          description: "Order Refund",
          quantity: 1,
          unitPriceExVat: -650,
          vatRatePercent: 5,
          vatAmount: -32.5,
          totalExVat: -650
        }
      ],
      subtotalExVat: -650,
      totalVat: -32.5,
      grandTotalInclVat: -682.5,
      paymentMethod: "wallet_refund",
      isPaid: true,
      currency: "BDT",
      isTestData: true
    },
    // Other Documents
    {
      documentType: "receipt",
      documentNumber: "GR-10021",
      documentDate: new Date("2025-10-05"),
      supplierName: "Fresh Mart",
      supplierVatNumber: "BD123456789",
      supplierCountry: "BD",
      items: [
        {
          description: "Rice",
          quantity: 5,
          unitPriceExVat: 55,
          vatRatePercent: 5,
          vatAmount: 13.75,
          totalExVat: 275
        }
      ],
      subtotalExVat: 275,
      totalVat: 13.75,
      grandTotalInclVat: 288.75,
      paymentMethod: "cash",
      isPaid: true,
      currency: "BDT",
      isTestData: true
    },
    {
      documentType: "invoice",
      documentNumber: "NET-88912",
      documentDate: new Date("2025-11-01"),
      supplierName: "LinkUp Internet",
      supplierVatNumber: "BD987654321",
      supplierCountry: "BD",
      items: [
        {
          description: "Monthly Internet Package",
          quantity: 1,
          unitPriceExVat: 1200,
          vatRatePercent: 10,
          vatAmount: 120,
          totalExVat: 1200
        }
      ],
      subtotalExVat: 1200,
      totalVat: 120,
      grandTotalInclVat: 1320,
      paymentMethod: "mobile_banking",
      isPaid: true,
      currency: "BDT",
      isTestData: true
    },
    {
      documentType: "receipt",
      documentNumber: "OFF-55201",
      documentDate: new Date("2025-09-18"),
      supplierName: "Stationery World",
      supplierVatNumber: "NL112233445B01",
      supplierCountry: "NL",
      items: [
        {
          description: "Printer Paper A4",
          quantity: 2,
          unitPriceExVat: 8.5,
          vatRatePercent: 21,
          vatAmount: 3.57,
          totalExVat: 17
        }
      ],
      subtotalExVat: 17,
      totalVat: 3.57,
      grandTotalInclVat: 20.57,
      paymentMethod: "card",
      isPaid: true,
      currency: "EUR",
      isTestData: true
    },
    {
      documentType: "receipt",
      documentNumber: "FOOD-77419",
      documentDate: new Date("2025-12-02"),
      supplierName: "Dhaka Dine",
      supplierVatNumber: "BD556677889",
      supplierCountry: "BD",
      items: [
        {
          description: "Dinner Combo",
          quantity: 2,
          unitPriceExVat: 450,
          vatRatePercent: 7.5,
          vatAmount: 67.5,
          totalExVat: 900
        }
      ],
      subtotalExVat: 900,
      totalVat: 67.5,
      grandTotalInclVat: 967.5,
      paymentMethod: "card",
      isPaid: true,
      currency: "BDT",
      isTestData: true
    },
    {
      documentType: "transaction",
      documentNumber: "SAL-DEC-2025",
      documentDate: new Date("2025-12-01"),
      supplierName: "Betopia Group",
      supplierCountry: "BD",
      items: [
        {
          description: "Monthly Salary",
          quantity: 1,
          unitPriceExVat: 55000,
          vatRatePercent: 0,
          vatAmount: 0,
          totalExVat: 55000
        }
      ],
      subtotalExVat: 55000,
      totalVat: 0,
      grandTotalInclVat: 55000,
      paymentMethod: "bank_transfer",
      isPaid: true,
      currency: "BDT",
      category: "Credit (Salary)",
      isTestData: true
    },
    {
      documentType: "invoice",
      documentNumber: "ELEC-33109",
      documentDate: new Date("2025-11-25"),
      supplierName: "PowerGrid BD",
      supplierVatNumber: "BD334455667",
      supplierCountry: "BD",
      items: [
        {
          description: "Electricity Usage",
          quantity: 1,
          unitPriceExVat: 1850,
          vatRatePercent: 5,
          vatAmount: 92.5,
          totalExVat: 1850
        }
      ],
      subtotalExVat: 1850,
      totalVat: 92.5,
      grandTotalInclVat: 1942.5,
      paymentMethod: "online_payment",
      isPaid: false,
      currency: "BDT",
      isTestData: true
    }
  ];

  for (const doc of documents) {
    await prisma.financialDocument.upsert({
      where: { documentNumber: doc.documentNumber },
      create: {
        ...doc,
        userId: "fe69e153-9cd2-49e6-a7e8-632922878da6"
      },
      update: {
        ...doc,
        userId: "fe69e153-9cd2-49e6-a7e8-632922878da6"
      }
    });
  }

  console.log(`✅ ${documents.length} Financial Documents seeded successfully`);
}


async function main() {
  console.log('🚀 Seeding started...');

  await seedSuperAdmin();
  await seedPermissions();
  await seedFinancialDocuments();

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
