import { z } from "zod";

// Enum para acciones de auditoría
export const AuditActionEnum = z.enum(["CREATE", "UPDATE", "DELETE"]);

// Esquema para crear un registro de auditoría
export const auditLogSchema = z.object({
    action: AuditActionEnum,
    entity: z.string().min(1, "El nombre de la entidad es requerido"),
    entityId: z.number().int().positive("El ID de la entidad debe ser un número positivo"),
    oldValues: z.string().optional(), // JSON string con valores anteriores
    newValues: z.string().optional(), // JSON string con valores nuevos
    info: z.string().max(1000).optional(), // Información adicional
    userId: z.number().int().positive("El ID del usuario es requerido")
});

// Tipo TypeScript derivado del esquema
export type AuditLogData = z.infer<typeof auditLogSchema>;

// Esquema para consultar logs de auditoría
export const auditLogQuerySchema = z.object({
    entity: z.string().optional(),
    entityId: z.number().optional(),
    action: AuditActionEnum.optional(),
    userId: z.number().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).default(100),
    offset: z.number().int().min(0).default(0)
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;