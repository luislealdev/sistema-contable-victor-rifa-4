/*
  Warnings:

  - Added the required column `client` to the `RaffleTicket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RaffleTicket" DROP CONSTRAINT "RaffleTicket_clientId_fkey";

-- AlterTable
ALTER TABLE "RaffleTicket" ADD COLUMN     "client" TEXT NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
