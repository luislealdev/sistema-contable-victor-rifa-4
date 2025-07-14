import { RaffleTicket, RaffleTicketPayment } from "@prisma/client";

// Función para filtrar números basado en el término de búsqueda
export const filterNumbers = (
    numbers: number[],
    searchTerm: string,
    occupiedNumbers: Map<number, RaffleTicket & { payments: RaffleTicketPayment[], client: { id: number, name: string } }>
): number[] => {
    if (!searchTerm.trim()) return numbers;
    
    const formatNumber = (num: number): string => {
        return num < 10 ? `0${num}` : num.toString();
    };
    
    return numbers.filter(number => {
        const ticket = occupiedNumbers.get(number);
        const numberStr = formatNumber(number);
        const searchLower = searchTerm.toLowerCase();
        
        // Buscar por número
        if (numberStr.includes(searchLower)) return true;
        
        // Buscar por nombre de cliente si existe
        if (ticket && ticket.client.name.toLowerCase().includes(searchLower)) return true;
        
        return false;
    });
};

// Función para crear mapa de números ocupados
export const createOccupiedNumbersMap = (
    tickets: (RaffleTicket & { payments: RaffleTicketPayment[] })[]
): Map<number, RaffleTicket & { payments: RaffleTicketPayment[] }> => {
    const occupiedNumbers = new Map<number, RaffleTicket & { payments: RaffleTicketPayment[] }>();
    tickets.forEach(ticket => {
        occupiedNumbers.set(ticket.number, ticket);
    });
    return occupiedNumbers;
};

// Función para generar array de números
export const generateNumbers = (totalNumbers: number): number[] => {
    return Array.from({ length: totalNumbers }, (_, i) => i + 1);
};

// Función para obtener números disponibles
export const getAvailableNumbers = (
    numbers: number[],
    occupiedNumbers: Map<number, RaffleTicket & { payments: RaffleTicketPayment[] }>
): number[] => {
    return numbers.filter(num => !occupiedNumbers.has(num));
};
