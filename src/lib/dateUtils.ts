/**
 * Retorna a string YYYY-MM-DD da segunda-feira da semana atual.
 */
export function getCurrentMonday(): string {
    const now = new Date();
    const day = now.getDay(); // 0 (Dom) - 6 (Sab)

    // Diferença para chegar na segunda (1)
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);

    // Formatar manualmente YYYY-MM-DD para garantir que seja a data local
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const date = String(monday.getDate()).padStart(2, '0');

    return `${year}-${month}-${date}`;
}

/**
 * Retorna a string YYYY-MM-DD do primeiro dia do mês atual.
 */
export function getCurrentMonthFirstDay(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
}
