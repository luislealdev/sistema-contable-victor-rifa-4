'use server';
import prisma from "@/lib/prisma";
import { raffleSchema } from "@/schema/raffle";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export async function createOrUpdateRaffle(raffle: unknown) {
    const parsedRaffle = raffleSchema.safeParse(raffle);
    if (!parsedRaffle.success) {
        return {
            ok: false,
            message: "Información de la rifa inválida",
        };
    }

    try {
        const isUpdate = parsedRaffle.data.id && parsedRaffle.data.id > 0;
        let oldRaffle = null;

        // Si es actualización, obtener valores anteriores
        if (isUpdate) {
            oldRaffle = await prisma.raffle.findUnique({
                where: { id: parsedRaffle.data.id }
            });
        }

        const savedRaffle = await prisma.raffle.upsert({
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

        // Registrar auditoría
        await createAuditLog({
            action: isUpdate ? 'UPDATE' : 'CREATE',
            entity: 'Raffle',
            entityId: savedRaffle.id,
            oldValues: oldRaffle ? {
                title: oldRaffle.title,
                drawDate: oldRaffle.drawDate,
                ticketPrice: oldRaffle.ticketPrice,
                totalNumbers: oldRaffle.totalNumbers,
                prize: oldRaffle.prize
            } : undefined,
            newValues: {
                title: savedRaffle.title,
                drawDate: savedRaffle.drawDate,
                ticketPrice: savedRaffle.ticketPrice,
                totalNumbers: savedRaffle.totalNumbers,
                prize: savedRaffle.prize
            },
            info: `Rifa ${isUpdate ? 'actualizada' : 'creada'}: ${savedRaffle.title}`
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