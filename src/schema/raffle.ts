import { z } from "zod";

export const raffleSchema = z.object({
    id: z.number().int().optional(),
    title: z.string().min(1, "Title is required"),
    drawDate: z.date().default(() => new Date()),
    ticketPrice: z.number().min(0, "Ticket price must be a positive number"),
    totalNumbers: z.number().int().min(1, "Total tickets must be at least 1"),
    prize: z.string().min(1, "Prize is required"),
});

export const raffleTicketSchema = z.object({
    id: z.number().int().optional(),
    number: z.number().int().min(1, "Ticket number must be at least 1"),
    raffleId: z.number().int(),
    client: z.string().min(1, "Client name is required"),
    totalPaid: z.number().min(0, "Total paid must be a positive number").default(0),
    isPaid: z.boolean().default(false),
});

export const raffleTicketPayment = z.object({
    id: z.number().int().optional(),
    amount: z.number().min(0, "Amount must be a positive number"),
    date: z.date().default(() => new Date()),
    ticketId: z.number().int()
});