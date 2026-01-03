-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('ERROR', 'SUCCESS', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "logpriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Logger" (
    "id" SERIAL NOT NULL,
    "level" "LogType" NOT NULL,
    "logpriority" "logpriority" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Logger_pkey" PRIMARY KEY ("id")
);
