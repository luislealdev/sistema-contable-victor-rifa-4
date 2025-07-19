'use server';

import prisma from "@/lib/prisma";
import { clientSchema } from "@/schema/client";
import { revalidatePath } from "next/cache";

export async function createOrUpdateClient(client: unknown) {
    const parsedClient = clientSchema.safeParse(client);

    if (!parsedClient.success) {
        return {
            ok: false,
            message: "Información del cliente inválida",
        };
    }

    try {
        await prisma.client.upsert({
            where: {
                id: parsedClient.data.id || 0, // Use 0 for new clients
            },
            create: {
                ...parsedClient.data
            },
            update: {
                ...parsedClient.data,
            },
        });

        revalidatePath('/app');
        revalidatePath('/rifas/');

        return {
            ok: true,
            message: `Cliente ${parsedClient.data.id ? 'actualizado' : 'creado'} correctamente`,
        };

    } catch {
        return {
            ok: false,
            message: `Error al ${parsedClient.data.id ? 'actualizar' : 'crear'} el cliente`,
        };
    }

}