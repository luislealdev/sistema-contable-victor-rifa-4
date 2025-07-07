/*
  Warnings:

  - You are about to drop the column `clientId` on the `RaffleTicket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "RaffleTicket" DROP CONSTRAINT "RaffleTicket_clientId_fkey";

-- AlterTable
ALTER TABLE "RaffleTicket" DROP COLUMN "clientId";
