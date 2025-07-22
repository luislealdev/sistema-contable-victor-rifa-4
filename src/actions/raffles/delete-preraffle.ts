'use server';
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const deletePreRaffle = async (id: number) => {
    try {
        const deletedPreRaffle = await prisma.preRaffle.delete({
            where: {
                id,
            },
        });

        // Revalidate the path to ensure the latest data is fetched
        revalidatePath('/app/rifas');

        return {
            ok: true,
            message: "Pre-rifa eliminada correctamente",
            data: deletedPreRaffle,
        };
    } catch (error) {
        console.error("Error deleting pre-raffle:", error);
        return {
            ok: false,
            message: "Error al eliminar la pre-rifa",
        };
    }
};
