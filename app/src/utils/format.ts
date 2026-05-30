// Constructing an Intl.NumberFormat is ~10x more expensive than calling .format() on it,
// and these helpers run on every numeric cell across the app. Cache one formatter per config.
const currencyFormatters = new Map<string, Intl.NumberFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
    value: number,
    options: { currency?: string; decimals?: number } = {}
): string {
    const { currency = "ARS", decimals = 0 } = options;
    const key = `${currency}-${decimals}`;
    let fmt = currencyFormatters.get(key);
    if (!fmt) {
        fmt = new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
        currencyFormatters.set(key, fmt);
    }
    return fmt.format(value);
}

export function formatNumber(
    value: number,
    options: { decimals?: number; dynamic?: boolean; trim?: boolean } = {}
): string {
    const { dynamic = false, trim = false } = options;

    let minDecimals: number;
    let maxDecimals: number;

    if (trim) {
        minDecimals = 0;
        maxDecimals = 2;
    } else if (dynamic) {
        const d = value % 1 !== 0 ? 2 : 0;
        minDecimals = d;
        maxDecimals = d;
    } else {
        const d = options.decimals ?? 2;
        minDecimals = d;
        maxDecimals = d;
    }

    const key = `${minDecimals}-${maxDecimals}`;
    let fmt = numberFormatters.get(key);
    if (!fmt) {
        fmt = new Intl.NumberFormat("es-AR", {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals,
        });
        numberFormatters.set(key, fmt);
    }
    return fmt.format(value);
}

export function formatPercent(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

export function parseLocaleNumber(value: string): number {
    if (!value) return NaN;

    const lastDot = value.lastIndexOf(".");
    const lastComma = value.lastIndexOf(",");

    if (lastComma > lastDot) {
        // es-AR format: comma is decimal, dot is thousands
        return parseFloat(value.replace(/\./g, "").replace(",", "."));
    }

    // No comma: if last dot is followed by exactly 3 digits, it's thousands separator
    if (lastComma === -1 && lastDot >= 0) {
        const afterDot = value.slice(lastDot + 1);
        if (/^\d{3}$/.test(afterDot)) {
            return parseFloat(value.replace(/\./g, ""));
        }
    }

    // English or plain format: comma is thousands, dot is decimal (or no separator)
    return parseFloat(value.replace(/,/g, ""));
}

const inputFormatter = new Intl.NumberFormat("es-AR", { useGrouping: false });

export function formatForInput(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return inputFormatter.format(num);
}
