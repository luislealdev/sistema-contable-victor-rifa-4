-- CreateTable
CREATE TABLE "PreRaffle" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "drawDate" TIMESTAMP(3) NOT NULL,
    "raffleId" INTEGER NOT NULL,
    "prize" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreRaffle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PreRaffle" ADD CONSTRAINT "PreRaffle_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
