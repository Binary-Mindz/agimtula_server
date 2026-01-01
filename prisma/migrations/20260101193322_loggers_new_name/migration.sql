/*
  Warnings:

  - You are about to drop the `Logger` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Logger";

-- CreateTable
CREATE TABLE "Loggers" (
    "id" SERIAL NOT NULL,
    "level" "LogType" NOT NULL,
    "logpriority" "logpriority" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loggers_pkey" PRIMARY KEY ("id")
);
