'use server';

import prisma from "@/lib/prisma";
import { transactionSchema } from "@/schema/transaction";
import { sendWhatsApp } from "@/utils/send-whatsapp";
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

        // Get the client to send WhatsApp message
        const client = await prisma.client.findUnique({
            where: { id: parsedTransaction.data.clientId },
            select: { phone: true, name: true }
        });

        // Total client debt calculation
        const transactionDebt = await prisma.transaction.aggregate({
            where: { clientId: parsedTransaction.data.clientId },
            _sum: { totalAmount: true }
        });

        const raffleTicketsDebt = await prisma.raffleTicket.findMany({
            where: { clientId: parsedTransaction.data.clientId },
            include: {
                raffle: {
                    select: { ticketPrice: true }
                }
            }
        });

        // Calculate total raffle debt
        const totalRaffleDebt = raffleTicketsDebt.reduce((total, ticket) => {
            return total + ticket.raffle.ticketPrice;
        }, 0);

        const payments = await prisma.payment.aggregate({
            where: { clientId: parsedTransaction.data.clientId },
            _sum: { amount: true }
        });

        const rest = (transactionDebt._sum.totalAmount || 0) + totalRaffleDebt - (payments._sum.amount || 0);

        if (client?.phone) {
            // Send WhatsApp message to the client
            const message = `Hola ${client.name}, se ha agregado una nueva transacción a tu cuenta. ` +
                `Detalles:\n` +
                `Monto Total: ${parsedTransaction.data.totalAmount}\n` +
                `Descripción: ${parsedTransaction.data.description || 'Sin descripción'}\n` +
                `Monto Restante: ${rest}\n` +
                `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarnos.`;

            sendWhatsApp(client.phone, message);
        }


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