/*
  Warnings:

  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Contact" DROP CONSTRAINT "Contact_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_contactId_fkey";

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "contactId" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Contact";
