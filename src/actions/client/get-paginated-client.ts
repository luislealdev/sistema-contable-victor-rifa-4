'use server';

import prisma from "@/lib/prisma";

export async function getPaginatedClients(page: number = 1, sectionId?: number, search?: string) {

    const pageSize = 50;
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
                    },
                },
                RaffleTicket: {
                    include: {
                        raffle: true
                    }
                },
                payments: true
            }
        });

        // Calculate debt for each client
        const clientsWithDebt = clients.map(client => {
            // 1. Transaction debt
            const transactionDebt = client.transactions.filter(transaction => transaction.type != 'SERVICE').reduce((total, transaction) => {
                return total + transaction.totalAmount;
            }, 0);
            // 2. Raffle tickets debt
            const raffleDebt = client.RaffleTicket.reduce((total, ticket) => {
                const ticketPrice = ticket.raffle.ticketPrice;
                return total + Math.max(0, ticketPrice);
            }, 0);

            const raffleRemaining = client.RaffleTicket.reduce((total, ticket) => {
                const ticketPrice = ticket.raffle.ticketPrice;
                return total + Math.max(0, ticketPrice - ticket.totalPaid);
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

                    if (isCurrentMonthService && serviceTransaction.totalAmount > 0) {
                        return total + serviceTransaction.totalAmount;
                    }

                    return total;
                }, 0);

            // 4. Payments already made by the client
            const payments = client.payments.reduce((total, payment) => {
                return total + payment.amount;
            }, 0);

            // Calculate total debt for the client
            // const clientTotalDebt = transactionDebt + raffleDebt + monthlyServiceDebt - payments;
            const clientTotalDebt = transactionDebt + monthlyServiceDebt - payments;
            return {
                ...client,
                totalDebt: clientTotalDebt,
                transactionDebt: transactionDebt,
                raffleDebt: raffleDebt,
                raffleId: client.RaffleTicket.length > 0 ? client.RaffleTicket[0].raffle.id : null,
                raffleRemaining: raffleRemaining,
                monthlyServiceDebt: monthlyServiceDebt,
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
                    },
                },
                // raffleTickets: {
                //     include: {
                //         raffle: true
                //     }
                // },
                payments: true
            }
        });

        // Calculate total debt for ALL filtered clients
        const totalDebtSummary = allClientsForDebtCalculation.reduce((summary, client) => {
            // 1. Transaction debt
            const transactionDebt = client.transactions.filter(transaction => transaction.type != 'SERVICE').reduce((total, transaction) => {
                return total + transaction.totalAmount;
            }, 0);

            // 2. Raffle tickets debt
            // const raffleDebt = client.raffleTickets.reduce((total, ticket) => {
            //     const ticketPrice = ticket.raffle.ticketPrice;
            //     return total + Math.max(0, ticketPrice);
            // }, 0);

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

                    if (isCurrentMonthService) {
                        return total + serviceTransaction.totalAmount;
                    }

                    return total;
                }, 0);

            // 4. Payments already made by the client
            const payments = client.payments.reduce((total, payment) => {
                return total + payment.amount;
            }, 0);

            const clientTotalDebt = transactionDebt + monthlyServiceDebt - payments;

            return {
                totalTransactionDebt: summary.totalTransactionDebt + transactionDebt,
                // totalRaffleDebt: summary.totalRaffleDebt + raffleDebt, // Ignored as per the original code
                totalRaffleDebt: summary.totalRaffleDebt, // Ignored as per the original code
                totalMonthlyServiceDebt: summary.totalMonthlyServiceDebt + monthlyServiceDebt,
                grandTotalDebt: summary.grandTotalDebt + clientTotalDebt
            };
        }, {
            totalTransactionDebt: 0,
            totalRaffleDebt: 0,
            totalMonthlyServiceDebt: 0,
            grandTotalDebt: 0
        });

        // Get client counts by section (for all clients, not just current page)
        const sectionCounts = await prisma.client.groupBy({
            by: ['sectionId'],
            _count: {
                id: true
            }
        });

        // Transform section counts to a more usable format
        const sectionCountsMap: Record<string, number> = {};
        sectionCounts.forEach(count => {
            const key = count.sectionId ? count.sectionId.toString() : 'null';
            sectionCountsMap[key] = count._count.id;
        });

        // Get total clients count (for "Todas" section)
        const totalClientsCount = await prisma.client.count();

        return {
            ok: true,
            clients: clientsWithDebt,
            totalPages: Math.ceil(totalClients / pageSize),
            currentPage: page,
            totalClients,
            sectionCounts: sectionCountsMap,
            totalClientsCount,
            debtSummary: {
                totalTransactionDebt: Number(totalDebtSummary.totalTransactionDebt.toFixed(2)),
                totalRaffleDebt: Number(totalDebtSummary.totalRaffleDebt.toFixed(2)), // Ignored as per the original cod
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