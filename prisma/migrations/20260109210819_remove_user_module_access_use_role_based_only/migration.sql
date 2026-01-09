/*
  Warnings:

  - You are about to drop the `user_module_access` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_module_access" DROP CONSTRAINT "user_module_access_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "user_module_access" DROP CONSTRAINT "user_module_access_userId_fkey";

-- DropTable
DROP TABLE "user_module_access";
