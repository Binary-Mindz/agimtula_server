/*
  Warnings:

  - You are about to drop the `role_module` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "role_module" DROP CONSTRAINT "role_module_moduleId_fkey";

-- DropTable
DROP TABLE "role_module";
