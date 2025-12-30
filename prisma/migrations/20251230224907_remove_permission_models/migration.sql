/*
  Warnings:

  - You are about to drop the `permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_permission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "permission" DROP CONSTRAINT "permission_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "role_permission" DROP CONSTRAINT "role_permission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission" DROP CONSTRAINT "user_permission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "user_permission" DROP CONSTRAINT "user_permission_userId_fkey";

-- DropTable
DROP TABLE "permission";

-- DropTable
DROP TABLE "role_permission";

-- DropTable
DROP TABLE "user_permission";

-- DropEnum
DROP TYPE "PermissionAction";
