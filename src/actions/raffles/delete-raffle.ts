'use server';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export async function deleteRaffle(raffleId: number) {
    try {
        // Obtener datos de la rifa antes de verificar restricciones
        const raffleToDelete = await prisma.raffle.findUnique({
            where: { id: raffleId }
        });

        if (!raffleToDelete) {
            return {
                ok: false,
                message: 'Rifa no encontrada'
            };
        }

        // Check if the raffle has any tickets
        const raffleTicketsCount = await prisma.raffleTicket.count({
            where: {
                raffleId: raffleId,
            },
        });

        // If there are tickets, prevent deletion
        if (raffleTicketsCount > 0) {
            return {
                ok: false,
                message: `No se puede eliminar la rifa porque tiene ${raffleTicketsCount} boleto(s) asociado(s)`,
            };
        }

        // Delete the raffle
        await prisma.raffle.delete({
            where: {
                id: raffleId,
            },
        });

        // Registrar auditoría
        await createAuditLog({
            action: 'DELETE',
            entity: 'Raffle',
            entityId: raffleId,
            oldValues: {
                title: raffleToDelete.title,
                drawDate: raffleToDelete.drawDate,
                ticketPrice: raffleToDelete.ticketPrice,
                totalNumbers: raffleToDelete.totalNumbers,
                prize: raffleToDelete.prize
            },
            info: `Rifa eliminada: ${raffleToDelete.title}`
        });

        revalidatePath('//rifas');

        return {
            ok: true,
            message: "Rifa eliminada correctamente",
        };
    } catch (error) {
        console.error("Error deleting raffle:", error);
        return {
            ok: false,
            message: "Error al eliminar la rifa",
        };
    }
}