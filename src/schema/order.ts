import { z } from "zod";

// Esquema para OrderItem
export const orderItemSchema = z.object({
    id: z.number().optional(),
    gender: z.enum(["hombre", "mujer", "niño", "niña"]),
    number: z.string().optional(),
    orderId: z.number().optional() // Opcional porque puede ser una nueva orden
});

// Esquema para Order con compatibilidad con datos antiguos y nuevos
export const orderSchema = z.object({
    id: z.number().min(1).optional(),
    client: z.string().min(2).max(100),
    gender: z.enum(["hombre", "mujer", "niño", "niña"]).optional(), // Mantener para compatibilidad
    product: z.string().optional(),
    number: z.string().optional(), // Mantener para compatibilidad
    specifications: z.string().max(500).optional(),
    totalAmount: z.number().default(0).optional(),
    OrderItem: z.array(orderItemSchema).optional()
});