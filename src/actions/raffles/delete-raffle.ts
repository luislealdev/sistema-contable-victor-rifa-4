'use server';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteRaffle(raffleId: number) {
    try {
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

        revalidatePath('/app/rifas');

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