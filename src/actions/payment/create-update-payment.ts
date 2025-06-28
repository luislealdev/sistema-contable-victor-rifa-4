'use server';

import prisma from "@/lib/prisma";
import { paymentSchema } from "@/schema/transaction";
import { revalidatePath } from "next/cache";

export async function createOrUpdatePayment(payment: unknown) {
    const parsedPayment = paymentSchema.safeParse(payment);
    if (!parsedPayment.success) {
        return {
            ok: false,
            message: "Información del pago inválida",
        };
    }

    try {
        // Create or update payment
        const savedPayment = await prisma.payment.upsert({
            where: {
                id: parsedPayment.data.id || 0, // Use 0 for new payments
            },
            create: {
                amount: parsedPayment.data.amount,
                date: parsedPayment.data.date,
                description: parsedPayment.data.description,
                clientId: parsedPayment.data.clientId,
                transactionId: parsedPayment.data.transactionId,
            },
            update: {
                amount: parsedPayment.data.amount,
                date: parsedPayment.data.date,
                description: parsedPayment.data.description,
                transactionId: parsedPayment.data.transactionId,
            },
        });

        // If payment is linked to a transaction, update the remaining amount
        if (savedPayment.transactionId) {
            // Calculate total payments for this transaction
            const totalPaid = await prisma.payment.aggregate({
                where: { transactionId: savedPayment.transactionId },
                _sum: { amount: true }
            });

            // Get the transaction to calculate remaining
            const transaction = await prisma.transaction.findUnique({
                where: { id: savedPayment.transactionId }
            });

            if (transaction) {
                const remaining = Math.max(0, transaction.totalAmount - (totalPaid._sum.amount || 0));
                
                await prisma.transaction.update({
                    where: { id: savedPayment.transactionId },
                    data: { remaining }
                });
            }
        }

        revalidatePath('/app');
        revalidatePath(`/app/${parsedPayment.data.clientId}`);

        return {
            ok: true,
            message: `Pago ${parsedPayment.data.id ? 'actualizado' : 'registrado'} correctamente`,
        };
    } catch (error) {
        console.error("Error creating/updating payment:", error);
        return {
            ok: false,
            message: "Error al procesar el pago",
        };
    }
}
