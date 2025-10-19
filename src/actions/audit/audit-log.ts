'use server';

import prisma from "@/lib/prisma";
import { auditLogSchema, type AuditLogData } from "@/schema/audit";

/**
 * Función utilitaria para crear registros de auditoría
 * Registra todas las acciones CRUD en el sistema
 */
export const createAuditLog = async ({
    action,
    entity,
    entityId,
    oldValues,
    newValues,
    info,
    userId = 1 // Por defecto usuario 1, cambiar según tu sistema de autenticación
}: {
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    entity: string;
    entityId: number;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    info?: string;
    userId?: number;
}): Promise<{ ok: boolean; error?: string }> => {
    try {
        // Preparar datos para validación
        const auditData: AuditLogData = {
            action,
            entity,
            entityId,
            oldValues: oldValues ? JSON.stringify(oldValues, null, 2) : undefined,
            newValues: newValues ? JSON.stringify(newValues, null, 2) : undefined,
            info,
            userId
        };

        // Validar datos con Zod
        const validatedData = auditLogSchema.parse(auditData);

        // Crear registro de auditoría
        await prisma.auditLog.create({
            data: validatedData
        });

        return { ok: true };
    } catch (error) {
        console.error('Error al crear registro de auditoría:', error);
        return { 
            ok: false, 
            error: error instanceof Error ? error.message : 'Error desconocido' 
        };
    }
};

/**
 * Función para obtener logs de auditoría con filtros
 */
export const getAuditLogs = async ({
    entity,
    entityId,
    action,
    userId,
    limit = 100,
    offset = 0
}: {
    entity?: string;
    entityId?: number;
    action?: 'CREATE' | 'UPDATE' | 'DELETE';
    userId?: number;
    limit?: number;
    offset?: number;
} = {}) => {
    try {
        const where: Record<string, unknown> = {};
        
        if (entity) where.entity = entity;
        if (entityId) where.entityId = entityId;
        if (action) where.action = action;
        if (userId) where.userId = userId;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            ok: true,
            logs,
            total,
            hasMore: offset + limit < total
        };
    } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
};