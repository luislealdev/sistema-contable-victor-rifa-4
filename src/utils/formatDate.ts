export const formatDate = (date: Date) => {
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatDateTime = (date: Date) => {
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};