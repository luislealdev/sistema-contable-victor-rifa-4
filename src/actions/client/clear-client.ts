'use server';
import prisma from "@/lib/prisma";
import { sendWhatsApp } from "@/utils/send-whatsapp";
import { revalidatePath } from "next/cache";

export const clearClient = async (clientId: number) => {
    try {
        // Verificar que el cliente existe
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { transactions: true, payments: true }
        });

        if (!client) {
            return {
                ok: false,
                message: 'Cliente no encontrado'
            };
        }

        // Contar las transacciones y pagos que se van a eliminar
        const transactionsCount = client.transactions.length;
        const paymentsCount = client.payments.length;

        // Eliminar todas las transacciones asociadas al cliente
        await prisma.transaction.deleteMany({
            where: { clientId }
        });

        // Eliminar todos los pagos asociados al cliente
        await prisma.payment.deleteMany({
            where: { clientId }
        });

        // Enviar mensaje de WhatsApp al cliente
        if (client.phone) {
            const message = `¡Hola ${client.name}! 😊\n\n` +
                `Se ha realizado una *limpieza completa* de tu cuenta. Aquí tienes los detalles:\n\n` +
                `🧹 *Acción realizada*: Limpieza de cuenta\n` +
                `📋 *Transacciones eliminadas*: ${transactionsCount}\n` +
                `💵 *Pagos eliminados*: ${paymentsCount}\n` +
                `💰 *Deuda actual*: $0.00\n\n` +
                `Tu cuenta ha sido reiniciada y ahora tienes un saldo limpio. Si tienes alguna pregunta, no dudes en contactarme. *Torito* 📲.\n`;

            sendWhatsApp(client.phone, message);
        }

        revalidatePath('/app');
        revalidatePath(`/app/${clientId}`);

        return {
            ok: true,
            message: 'Datos asociados eliminados correctamente'
        };
    } catch (error) {
        console.error('Error al eliminar información de el cliente:', error);
        return {
            ok: false,
            message: 'Error al eliminar información de el cliente'
        };
    }
};