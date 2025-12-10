/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `forgetPass` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "forgetPass_email_key" ON "forgetPass"("email");
