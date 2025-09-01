import { z } from "zod";

export const orderSchema = z.object({
    id: z.number().min(1).optional(),
    client: z.string().min(2).max(100),
    gender: z.enum(["hombre", "mujer", "niño", "niña"]).optional(),
    product: z.string().min(2).max(100).optional(),
    number: z.string().optional()
});