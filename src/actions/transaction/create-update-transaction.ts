'use server';

import prisma from "@/lib/prisma";
import { transactionSchema } from "@/schema/transaction";
import { revalidatePath } from "next/cache";

export async function createOrUpdateTransaction(transaction: unknown) {
    const parsedTransaction = transactionSchema.safeParse(transaction);
    if (!parsedTransaction.success) {
        return {
            ok: false,
            message: "Información de la transacción inválida",
        };
    }

    try {
        await prisma.transaction.upsert({
            where: {
                id: parsedTransaction.data.id || 0, // Use 0 for new transactions
            },
            create: {
                remaining: parsedTransaction.data.remaining || parsedTransaction.data.totalAmount,
                ...parsedTransaction.data
            },
            update: {
                remaining: parsedTransaction.data.remaining || parsedTransaction.data.totalAmount,
                ...parsedTransaction.data,
            },
        });

        revalidatePath('/app');
        revalidatePath(`/app/` + parsedTransaction.data.clientId);

        return {
            ok: true,
            message: `Transacción ${parsedTransaction.data.id ? 'actualizada' : 'creada'} correctamente`,
        };
    } catch (error) {
        console.error("Error creating/updating transaction:", error);
        return {
            ok: false,
            message: "Error al procesar la transacción",
        };
    }
}