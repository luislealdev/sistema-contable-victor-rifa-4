'use server';

import prisma from "@/lib/prisma";

export async function getClientInfoById(clientId: number) {
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
        });

        if (!client) {
            return { ok: false, message: 'Cliente no encontrado', data: null };
        }

        return { ok: true, data: client };

    } catch (error) {
        return { ok: false, message: 'No se pudo obtener la información del cliente', data: null };
    }
}