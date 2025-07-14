/*
  Warnings:

  - You are about to drop the column `client` on the `RaffleTicket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RaffleTicket" DROP COLUMN "client",
ADD COLUMN     "clientId" INTEGER;

-- AddForeignKey
ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
