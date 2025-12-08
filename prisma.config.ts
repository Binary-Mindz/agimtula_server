// import { config } from 'dotenv';
// import { expand } from 'dotenv-expand';
// import path from 'path';
// import type { PrismaConfig } from 'prisma';

// // Explicitly load environment variables
// expand(config({ path: path.resolve(process.cwd(), '.env'), quiet: true }));

// export default {
//   schema: path.join('prisma', 'schema'),
//   migrations: {
//     path: path.join('prisma', 'migrations'),
//   },
//   views: {
//     path: path.join('prisma', 'views'),
//   },
//   typedSql: {
//     path: path.join('prisma', 'queries'),
//   },
//   datasource: {
//     url: process.env.DATABASE_URL as string,
//   },
//   // experimental: {
//   //   studio: true,
//   //   adapter: true,
//   //   externalTables: true,
//   // },
// } satisfies PrismaConfig;

import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
