import { TransactionType } from "@prisma/client";
import { z } from "zod";

export const transactionSchema = z.object({
    id: z.number().int().optional(),
    type: z.nativeEnum(TransactionType),
    isActive: z.boolean().default(true).optional(),
    description: z.string().optional(),
    totalAmount: z.number().min(0, "Total amount must be a positive number"),
    // remaining: z.number().optional(),
    clientId: z.number().int()
});

export const paymentSchema = z.object({
    id: z.number().int().optional(),
    amount: z.number().min(0, "Amount must be a positive number"),
    date: z.date().default(() => new Date()),
    description: z.string().optional(),
    transactionId: z.number().int().optional(),
    clientId: z.number().int()
});