'use server';

import prisma from "@/lib/prisma";
import { paymentSchema } from "@/schema/transaction";
import { sendWhatsApp } from "@/utils/send-whatsapp";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export async function createOrUpdatePayment(payment: unknown) {
    const parsedPayment = paymentSchema.safeParse(payment);
    if (!parsedPayment.success) {
        return {
            ok: false,
            message: "Información del pago inválida",
        };
    }

    try {
        const isUpdate = parsedPayment.data.id && parsedPayment.data.id > 0;
        let oldPayment = null;

        // Si es actualización, obtener valores anteriores
        if (isUpdate) {
            oldPayment = await prisma.payment.findUnique({
                where: { id: parsedPayment.data.id },
                include: { client: true }
            });
        }

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
                // transactionId: parsedPayment.data.transactionId,
            },
            update: {
                amount: parsedPayment.data.amount,
                date: parsedPayment.data.date,
                description: parsedPayment.data.description,
                // transactionId: parsedPayment.data.transactionId,
            },
            include: { client: true }
        });

        // Registrar auditoría
        await createAuditLog({
            action: isUpdate ? 'UPDATE' : 'CREATE',
            entity: 'Payment',
            entityId: savedPayment.id,
            oldValues: oldPayment ? {
                amount: oldPayment.amount,
                date: oldPayment.date,
                description: oldPayment.description,
                clientId: oldPayment.clientId
            } : undefined,
            newValues: {
                amount: savedPayment.amount,
                date: savedPayment.date,
                description: savedPayment.description,
                clientId: savedPayment.clientId
            },
            info: `Pago ${isUpdate ? 'actualizado' : 'creado'} para cliente: ${savedPayment.client.name}`
        });

        // If payment is linked to a transaction, update the remaining amount
        // if (savedPayment.transactionId) {
            // Calculate total payments for this transaction
            // const totalPaid = await prisma.payment.aggregate({
            //     where: { transactionId: savedPayment.transactionId },
            //     _sum: { amount: true }
            // });

            // Get the transaction to calculate remaining
            // const transaction = await prisma.transaction.findUnique({
            //     where: { id: savedPayment.transactionId }
            // });

            // if (transaction) {
            //     const remaining = Math.max(0, transaction.totalAmount - (totalPaid._sum.amount || 0));

            //     await prisma.transaction.update({
            //         where: { id: savedPayment.transactionId },
            //         data: { remaining }
            //     });
            // }
        // }

        // Get the client to send WhatsApp message
        const client = await prisma.client.findUnique({
            where: { id: parsedPayment.data.clientId },
            select: { phone: true, name: true }
        });

        // Total client debt calculation
        const transactionDebt = await prisma.transaction.aggregate({
            where: { clientId: parsedPayment.data.clientId },
            _sum: { totalAmount: true }
        });

        // const raffleTicketsDebt = await prisma.raffleTicket.findMany({
        //     where: { clientId: parsedPayment.data.clientId },
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
            where: { clientId: parsedPayment.data.clientId },
            _sum: { amount: true }
        });

        // const rest = (transactionDebt._sum.totalAmount || 0) + totalRaffleDebt - (payments._sum.amount || 0);
        const rest = (transactionDebt._sum.totalAmount || 0) - (payments._sum.amount || 0);

        if (client?.phone) {
            // Send WhatsApp message to the client
            const message = `¡Hola ${client.name}! 😊\n\n` +
                `Tu pago de $${parsedPayment.data.amount.toFixed(2)} se ha ${parsedPayment.data.id ? 'actualizado' : 'registrado'} correctamente. 🎉\n\n` +
                `💰 *Deuda restante*: $${rest.toFixed(2)}\n\n` +
                `Gracias por tu preferencia. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;
            sendWhatsApp(client.phone, message);
        }

        revalidatePath('/');
        revalidatePath(`//${parsedPayment.data.clientId}`);

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
