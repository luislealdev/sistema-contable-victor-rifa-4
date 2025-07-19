'use server';
import prisma from "@/lib/prisma";

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

        // Eliminar todas las transacciones asociadas al cliente
        await prisma.transaction.deleteMany({
            where: { clientId }
        });

        // Eliminar todos los pagos asociados al cliente
        await prisma.payment.deleteMany({
            where: { clientId }
        });

        return {
            ok: true,
            message: 'Cliente y sus datos asociados eliminados correctamente'
        };
    } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        return {
            ok: false,
            message: 'Error al eliminar el cliente'
        };
    }
};