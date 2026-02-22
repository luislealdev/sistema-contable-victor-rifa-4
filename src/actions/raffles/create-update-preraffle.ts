'use server';
import prisma from "@/lib/prisma";
import { preRaffleSchema } from "@/schema/raffle";
import { revalidatePath } from "next/cache";

export const createUpdatePreRaffle = async (preRaffle: unknown) => {
    const parsedPreRaffle = preRaffleSchema.safeParse(preRaffle);
    if (!parsedPreRaffle.success) {
        return {
            ok: false,
            message: "Información de la pre-rifa inválida",
        };
    }

    try {
        const savedPreRaffle = await prisma.preRaffle.upsert({
            where: {
                id: parsedPreRaffle.data.id || 0, // Use 0 for new pre-raffles
            },
            create: {
                ...parsedPreRaffle.data,
            },
            update: {
                ...parsedPreRaffle.data,
            },
        });

        // Revalidate the path to ensure the latest data is fetched
        revalidatePath('//rifas');

        return {
            ok: true,
            message: `Pre-rifa ${savedPreRaffle.id ? "actualizada" : "creada"} correctamente`,
            data: savedPreRaffle,
        };
    } catch (error) {
        console.error("Error creating/updating pre-raffle:", error);
        return {
            ok: false,
            message: "Error al crear/actualizar la pre-rifa",
        };
    }
}

