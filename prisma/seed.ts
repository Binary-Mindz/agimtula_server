import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserRole } from '../prisma/generated/prisma/client';
import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

export function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      '❌ DATABASE_URL must be set in the environment variables.',
    );
  }
  const adapter = new PrismaPg({ connectionString });
  // Return the PrismaClient with the configured adapter and logging
  const prisma = new PrismaClient({
    adapter,
    log: [{ emit: 'event', level: 'error' }],
  });
  return prisma;
}

const prisma = createPrismaClient();

async function main() {
  const superAdminFirstName = process.env.SUPER_ADMIN_FIRSTNAME;
  const superAdminLastName = process.env.SUPER_ADMIN_LASTNAME;
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  //   const superAdminUsername = process.env.SUPER_ADMIN_USERNAME || 'superadmin';

  if (
    !superAdminEmail ||
    !superAdminPassword ||
    !superAdminFirstName ||
    !superAdminLastName
  ) {
    throw new Error(
      '❌ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env',
    );
  }

  // Check if admin already exists
  const existing = await prisma.email.findFirst({
    where: { email: superAdminEmail },
  });

  if (existing) {
    console.log('⚠️ Super admin already exists. Skipping seed.');
    return;
  }

  const hashed = await bcrypt.hash(superAdminPassword, 10);

  // ✅ Use Prisma Transaction
  const result = await prisma.user.create({
    data: {
      profile: {
        create: {
          firstName: superAdminFirstName,
          lastName: superAdminLastName,
        },
      },
      email: {
        create: {
          email: superAdminEmail,
        },
      },
      password: hashed,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Super Admin created successfully:', result);
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
