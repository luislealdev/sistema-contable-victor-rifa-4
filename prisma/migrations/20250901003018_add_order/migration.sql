-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "client" TEXT NOT NULL,
    "gender" TEXT,
    "product" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
