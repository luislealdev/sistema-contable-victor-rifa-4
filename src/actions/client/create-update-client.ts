'use server';

import prisma from "@/lib/prisma";
import { clientSchema } from "@/schema/client";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/actions/audit/audit-log";

export async function createOrUpdateClient(client: unknown) {
    const parsedClient = clientSchema.safeParse(client);

    if (!parsedClient.success) {
        return {
            ok: false,
            message: "Información del cliente inválida",
        };
    }

    try {
        const isUpdate = parsedClient.data.id && parsedClient.data.id > 0;
        let oldClient = null;

        // Si es actualización, obtener valores anteriores
        if (isUpdate) {
            oldClient = await prisma.client.findUnique({
                where: { id: parsedClient.data.id }
            });
        }

        const savedClient = await prisma.client.upsert({
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

        // Registrar auditoría
        await createAuditLog({
            action: isUpdate ? 'UPDATE' : 'CREATE',
            entity: 'Client',
            entityId: savedClient.id,
            oldValues: oldClient ? {
                name: oldClient.name,
                phone: oldClient.phone,
                address: oldClient.address,
                sectionId: oldClient.sectionId
            } : undefined,
            newValues: {
                name: savedClient.name,
                phone: savedClient.phone,
                address: savedClient.address,
                sectionId: savedClient.sectionId
            },
            info: `Cliente ${isUpdate ? 'actualizado' : 'creado'}: ${savedClient.name}`
        });

        revalidatePath('/');
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