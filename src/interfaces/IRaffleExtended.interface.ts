import { Client, PreRaffle, Raffle, RaffleTicket, RaffleTicketPayment } from "@prisma/client";

export interface IRaffleExtended extends Raffle {
    tickets: IRaffleTicketExtended[],
    PreRaffle: PreRaffle[]
}

export interface IRaffleTicketExtended extends RaffleTicket {
    payments: RaffleTicketPayment[],
    client: Client
}