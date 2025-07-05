'use server';
import prisma from "@/lib/prisma";
import { raffleSchema } from "@/schema/raffle";
import { revalidatePath } from "next/cache";

export async function createOrUpdateRaffle(raffle: unknown) {
    const parsedRaffle = raffleSchema.safeParse(raffle);
    if (!parsedRaffle.success) {
        return {
            ok: false,
            message: "Información de la rifa inválida",
        };
    }

    try {
        await prisma.raffle.upsert({
            where: {
                id: parsedRaffle.data.id || 0, // Use 0 for new raffles
            },
            create: {
                ...parsedRaffle.data
            },
            update: {
                ...parsedRaffle.data,
            },
        });

        revalidatePath('/app/rifas');

        return {
            ok: true,
            message: `Rifa ${parsedRaffle.data.id ? 'actualizada' : 'creada'} correctamente`,
        };

    } catch (error) {
        console.error("Error creating/updating raffle:", error);
        return {
            ok: false,
            message: `Error al ${parsedRaffle.data.id ? 'actualizar' : 'crear'} la rifa`,
        };
    }
}