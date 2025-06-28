import { z } from "zod";

export const clientSchema = z.object({
    id: z.number().int().optional(),
    name: z.string().min(1, "Name is required"),
    phone: z.string(),
    address: z.string().optional(),
    sectionId: z.number().int().optional()
})