'use server';

import prisma from "@/lib/prisma";
import { transactionSchema } from "@/schema/transaction";
import { sendWhatsApp } from "@/utils/send-whatsapp";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export async function createOrUpdateTransaction(transaction: unknown) {
    const parsedTransaction = transactionSchema.safeParse(transaction);
    if (!parsedTransaction.success) {
        return {
            ok: false,
            message: "Información de la transacción inválida",
        };
    }

    try {
        const isUpdate = parsedTransaction.data.id && parsedTransaction.data.id > 0;
        let oldTransaction = null;

        // Si es actualización, obtener valores anteriores
        if (isUpdate) {
            oldTransaction = await prisma.transaction.findUnique({
                where: { id: parsedTransaction.data.id },
                include: { client: true }
            });
        }

        const savedTransaction = await prisma.transaction.upsert({
            where: {
                id: parsedTransaction.data.id || 0, // Use 0 for new transactions
            },
            create: {
                // remaining: parsedTransaction.data.remaining || parsedTransaction.data.totalAmount,
                ...parsedTransaction.data
            },
            update: {
                // remaining: parsedTransaction.data.remaining || parsedTransaction.data.totalAmount,
                ...parsedTransaction.data,
            },
            include: { client: true }
        });

        // Registrar auditoría
        await createAuditLog({
            action: isUpdate ? 'UPDATE' : 'CREATE',
            entity: 'Transaction',
            entityId: savedTransaction.id,
            oldValues: oldTransaction ? {
                type: oldTransaction.type,
                isActive: oldTransaction.isActive,
                description: oldTransaction.description,
                totalAmount: oldTransaction.totalAmount,
                clientId: oldTransaction.clientId
            } : undefined,
            newValues: {
                type: savedTransaction.type,
                isActive: savedTransaction.isActive,
                description: savedTransaction.description,
                totalAmount: savedTransaction.totalAmount,
                clientId: savedTransaction.clientId
            },
            info: `Transacción ${isUpdate ? 'actualizada' : 'creada'} para cliente: ${savedTransaction.client.name}`
        });

        // Get the client to send WhatsApp message
        const client = savedTransaction.client;

        // Total client debt calculation
        const transactionDebt = await prisma.transaction.aggregate({
            where: { clientId: parsedTransaction.data.clientId },
            _sum: { totalAmount: true }
        });

        // const raffleTicketsDebt = await prisma.raffleTicket.findMany({
        //     where: { clientId: parsedTransaction.data.clientId },
        //     include: {
        //         raffle: {
        //             select: { ticketPrice: true }
        //         }
        //     }
        // });

        // Calculate total raffle debt
        // const totalRaffleDebt = raffleTicketsDebt.reduce((total, ticket) => {
        //     return total + ticket.raffle.ticketPrice;
        // }, 0);

        const payments = await prisma.payment.aggregate({
            where: { clientId: parsedTransaction.data.clientId },
            _sum: { amount: true }
        });

        // const rest = (transactionDebt._sum.totalAmount || 0) + totalRaffleDebt - (payments._sum.amount || 0);
        const rest = (transactionDebt._sum.totalAmount || 0) - (payments._sum.amount || 0);

        if (client?.phone) {
            // Send WhatsApp message to the client
            const message = `¡Hola ${client.name}! 😊\n\n` +
                `Se ha ${parsedTransaction.data.id ? 'actualizado' : 'registrado'} una transacción en tu cuenta. Aquí tienes los detalles:\n\n` +
                `💸 *Monto*: $${parsedTransaction.data.totalAmount.toFixed(2)}\n` +
                `📝 *Descripción*: ${parsedTransaction.data.description || 'Sin descripción'}\n` +
                `💰 *Saldo pendiente*: $${rest.toFixed(2)}\n\n` +
                `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;

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