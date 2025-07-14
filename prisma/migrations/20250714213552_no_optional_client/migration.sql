/*
  Warnings:

  - Made the column `clientId` on table `RaffleTicket` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "RaffleTicket" DROP CONSTRAINT "RaffleTicket_clientId_fkey";

-- AlterTable
ALTER TABLE "RaffleTicket" ALTER COLUMN "clientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
