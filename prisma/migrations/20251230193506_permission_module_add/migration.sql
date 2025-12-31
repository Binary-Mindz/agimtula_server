-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_module" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "moduleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "module_name_key" ON "module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_moduleId_action_key" ON "permission"("moduleId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_module_role_moduleId_key" ON "role_module"("role", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permission_role_permissionId_key" ON "role_permission"("role", "permissionId");

-- AddForeignKey
ALTER TABLE "permission" ADD CONSTRAINT "permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_module" ADD CONSTRAINT "role_module_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
