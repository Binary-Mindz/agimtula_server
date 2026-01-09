-- CreateTable
CREATE TABLE "role_module_permission" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "moduleId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_module_permission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "role_module_permission_role_moduleId_key" ON "role_module_permission"("role", "moduleId");

-- AddForeignKey
ALTER TABLE "role_module_permission" ADD CONSTRAINT "role_module_permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
