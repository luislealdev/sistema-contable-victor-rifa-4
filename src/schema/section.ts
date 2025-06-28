import { z } from "zod";

export const sectionSchema = z.object({
    id: z.number().int().optional(),
    name: z.string().min(1, "Name is required")
});