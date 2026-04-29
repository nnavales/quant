export function formatCurrency(
    value: number,
    options: { currency?: string; decimals?: number } = {}
): string {
    const { currency = "ARS", decimals = 0 } = options;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatNumber(
    value: number,
    options: { decimals?: number; dynamic?: boolean } = {}
): string {
    const { dynamic = false } = options;
    const decimals = dynamic
        ? value % 1 !== 0
            ? 2
            : 0
        : (options.decimals ?? 2);

    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
}
