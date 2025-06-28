'use server';

import prisma from "@/lib/prisma";

export async function getPaginatedClients(page: number = 1, sectionId?: number, search?: string) {

    const pageSize = 10;
    if (page < 1 || pageSize < 1) {
        page = 1;
    }

    try {
        const clients = await prisma.client.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            where: {
                ...(sectionId && { sectionId: sectionId }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                    ]
                })
            },
            orderBy: {
                name: 'asc',
            },
            include: {
                transactions: {
                    where: {
                        isActive: true
                    }
                },
                raffleTickets: {
                    where: {
                        isPaid: false
                    },
                    include: {
                        raffle: true,
                        payments: true
                    }
                }
            }
        });

        // Calculate debt for each client
        const clientsWithDebt = clients.map(client => {
            // 1. Transaction debt (remaining amount)
            const transactionDebt = client.transactions.reduce((total, transaction) => {
                return total + transaction.remaining;
            }, 0);

            // 2. Raffle tickets debt (unpaid tickets)
            const raffleDebt = client.raffleTickets.reduce((total, ticket) => {
                const ticketPrice = ticket.raffle.ticketPrice;
                const totalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const remainingTicketDebt = ticketPrice - totalPaid;
                return total + Math.max(0, remainingTicketDebt);
            }, 0);

            // 3. Monthly service debt (check if current month is paid)
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const monthlyServiceDebt = client.transactions
                .filter(transaction => transaction.type === 'SERVICE')
                .reduce((total, serviceTransaction) => {
                    // Check if this service was paid this month
                    const serviceCreatedDate = new Date(serviceTransaction.createdAt);
                    const isCurrentMonthService =
                        serviceCreatedDate.getMonth() === currentMonth &&
                        serviceCreatedDate.getFullYear() === currentYear;

                    // If it's a current month service and has remaining debt
                    if (isCurrentMonthService && serviceTransaction.remaining > 0) {
                        return total + serviceTransaction.remaining;
                    }

                    return total;
                }, 0);

            const totalDebt = transactionDebt + raffleDebt + monthlyServiceDebt;

            return {
                ...client,
                debt: {
                    transactionDebt: Number(transactionDebt.toFixed(2)),
                    raffleDebt: Number(raffleDebt.toFixed(2)),
                    monthlyServiceDebt: Number(monthlyServiceDebt.toFixed(2)),
                    totalDebt: Number(totalDebt.toFixed(2))
                },
                // Remove the included relations from the response to keep it clean
                transactions: undefined,
                raffleTickets: undefined
            };
        });

        const totalClients = await prisma.client.count(
            {
                where: {
                    ...(sectionId && { sectionId: sectionId }),
                    ...(search && {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { phone: { contains: search, mode: 'insensitive' } },
                        ]
                    })
                },
            }
        );

        // Get total debt for all clients (filtered by section if applicable)
        // This needs to be calculated from ALL clients, not just the current page
        const allClientsForDebtCalculation = await prisma.client.findMany({
            where: {
                ...(sectionId && { sectionId: sectionId }),
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { phone: { contains: search, mode: 'insensitive' } },
                    ]
                })
            },
            include: {
                transactions: {
                    where: {
                        isActive: true
                    }
                },
                raffleTickets: {
                    where: {
                        isPaid: false
                    },
                    include: {
                        raffle: true,
                        payments: true
                    }
                }
            }
        });

        // Calculate total debt for ALL filtered clients
        const totalDebtSummary = allClientsForDebtCalculation.reduce((summary, client) => {
            // 1. Transaction debt
            const transactionDebt = client.transactions.reduce((total, transaction) => {
                return total + transaction.remaining;
            }, 0);

            // 2. Raffle tickets debt
            const raffleDebt = client.raffleTickets.reduce((total, ticket) => {
                const ticketPrice = ticket.raffle.ticketPrice;
                const totalPaid = ticket.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const remainingTicketDebt = ticketPrice - totalPaid;
                return total + Math.max(0, remainingTicketDebt);
            }, 0);

            // 3. Monthly service debt
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const monthlyServiceDebt = client.transactions
                .filter(transaction => transaction.type === 'SERVICE')
                .reduce((total, serviceTransaction) => {
                    const serviceCreatedDate = new Date(serviceTransaction.createdAt);
                    const isCurrentMonthService =
                        serviceCreatedDate.getMonth() === currentMonth &&
                        serviceCreatedDate.getFullYear() === currentYear;

                    if (isCurrentMonthService && serviceTransaction.remaining > 0) {
                        return total + serviceTransaction.remaining;
                    }

                    return total;
                }, 0);

            const clientTotalDebt = transactionDebt + raffleDebt + monthlyServiceDebt;

            return {
                totalTransactionDebt: summary.totalTransactionDebt + transactionDebt,
                totalRaffleDebt: summary.totalRaffleDebt + raffleDebt,
                totalMonthlyServiceDebt: summary.totalMonthlyServiceDebt + monthlyServiceDebt,
                grandTotalDebt: summary.grandTotalDebt + clientTotalDebt
            };
        }, {
            totalTransactionDebt: 0,
            totalRaffleDebt: 0,
            totalMonthlyServiceDebt: 0,
            grandTotalDebt: 0
        });

        return {
            ok: true,
            clients: clientsWithDebt,
            totalPages: Math.ceil(totalClients / pageSize),
            currentPage: page,
            totalClients,
            debtSummary: {
                totalTransactionDebt: Number(totalDebtSummary.totalTransactionDebt.toFixed(2)),
                totalRaffleDebt: Number(totalDebtSummary.totalRaffleDebt.toFixed(2)),
                totalMonthlyServiceDebt: Number(totalDebtSummary.totalMonthlyServiceDebt.toFixed(2)),
                grandTotalDebt: Number(totalDebtSummary.grandTotalDebt.toFixed(2))
            }
        };
    } catch (error) {

        console.error("Error fetching paginated clients:", error);
        return {
            ok: false,
            message: "No se pudieron obtener los clientes",
        };
    }
}