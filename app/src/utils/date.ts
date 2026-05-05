/**
 * Parse a YYYY-MM-DD string as local time (no UTC shift).
 * new Date("2024-01-15") treats the date as UTC midnight, which
 * shifts back by the local timezone offset when displayed.
 * This avoids that bug by constructing the Date with local components.
 * Also handles datetime strings by extracting the date part.
 */
export function parseLocalDate(dateStr: string): Date {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export type DateFormat =
    | "YYYY/MM/DD"
    | "DD/MM/YYYY"
    | "MM/DD/YYYY"
    | "YYYY-MM-DD"
    | "DD-MM-YYYY"
    | "MM-DD-YYYY";

const DEFAULT_FORMAT: DateFormat = "DD/MM/YYYY";

export function formatDate(date: Date, format: DateFormat): string {
    const y = String(date.getFullYear());
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    switch (format) {
        case "YYYY/MM/DD":
            return `${y}/${m}/${d}`;
        case "DD/MM/YYYY":
            return `${d}/${m}/${y}`;
        case "MM/DD/YYYY":
            return `${m}/${d}/${y}`;
        case "YYYY-MM-DD":
            return `${y}-${m}-${d}`;
        case "DD-MM-YYYY":
            return `${d}-${m}-${y}`;
        case "MM-DD-YYYY":
            return `${m}-${d}-${y}`;
        default:
            return `${y}-${m}-${d}`;
    }
}

export function formatDateStr(dateStr: string, format: DateFormat): string {
    return formatDate(parseLocalDate(dateStr), format);
}

export function formatMonthStr(monthStr: string, format: DateFormat): string {
    const [year, month] = monthStr.split("-").map(Number);
    const y = String(year);
    const m = String(month).padStart(2, "0");

    switch (format) {
        case "YYYY/MM/DD":
            return `${y}/${m}`;
        case "DD/MM/YYYY":
            return `${m}/${y}`;
        case "MM/DD/YYYY":
            return `${m}/${y}`;
        case "YYYY-MM-DD":
            return `${y}-${m}`;
        case "DD-MM-YYYY":
            return `${m}-${y}`;
        case "MM-DD-YYYY":
            return `${m}-${y}`;
        default:
            return `${y}-${m}`;
    }
}

export function getDateFormat(value: unknown): DateFormat {
    const valid: DateFormat[] = [
        "YYYY/MM/DD",
        "DD/MM/YYYY",
        "MM/DD/YYYY",
        "YYYY-MM-DD",
        "DD-MM-YYYY",
        "MM-DD-YYYY",
    ];
    if (typeof value === "string" && valid.includes(value as DateFormat)) {
        return value as DateFormat;
    }
    return DEFAULT_FORMAT;
}

export interface DatePreset {
    label: string;
    from: string;
    to: string;
}

export function formatISODate(date: Date): string {
    return date.toISOString().split("T")[0];
}

export function formatShortDate(iso: string): string {
    const parts = iso.split("-");
    if (parts.length === 3) {
        const [, m, d] = parts;
        return `${d}/${m}`;
    }
    if (parts.length === 2) {
        const [y, m] = parts;
        return `${m}/${y.slice(2)}`;
    }
    return iso;
}

export function getTransactionDatePresets(): DatePreset[] {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());

    return [
        { label: "Hoy", from: formatISODate(today), to: formatISODate(today) },
        {
            label: "Este mes",
            from: formatISODate(new Date(today.getFullYear(), today.getMonth(), 1)),
            to: formatISODate(endOfMonth),
        },
        {
            label: "Mes anterior",
            from: formatISODate(lastMonthStart),
            to: formatISODate(lastMonthEnd),
        },
        {
            label: "Este año",
            from: formatISODate(new Date(today.getFullYear(), 0, 1)),
            to: formatISODate(new Date(today.getFullYear(), 11, 31)),
        },
        {
            label: "Últimos 3 meses",
            from: formatISODate(threeMonthsAgo),
            to: formatISODate(today),
        },
    ].sort((a, b) => b.from.localeCompare(a.from));
}

export function getHistoricalDatePresets(): DatePreset[] {
    const today = new Date();
    const startOfThisYear = new Date(today.getFullYear(), 0, 1);
    const endOfThisYear = new Date(today.getFullYear(), 11, 31);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return [
        { label: "Este año", from: formatISODate(startOfThisYear), to: formatISODate(endOfThisYear) },
        { label: "Este mes", from: formatISODate(startOfMonth), to: formatISODate(endOfMonth) },
        {
            label: "Año anterior",
            from: formatISODate(new Date(today.getFullYear() - 1, 0, 1)),
            to: formatISODate(new Date(today.getFullYear() - 1, 11, 31)),
        },
    ].sort((a, b) => b.from.localeCompare(a.from));
}

/* ─── Timezone-aware helpers ─── */

function getPartsInTimezone(date: Date, timezone?: string) {
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || undefined,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
        hour: get("hour"),
        minute: get("minute"),
        second: get("second"),
    };
}

/** Return a local Date whose calendar day matches the user's timezone. */
export function getNowInTimezone(timezone?: string): Date {
    const p = getPartsInTimezone(new Date(), timezone);
    return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

/** Parse a YYYY-MM-DD string into a Date using the user's timezone. */
export function parseLocalDateInTimezone(dateStr: string, timezone?: string): Date {
    const datePart = dateStr.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (!timezone) return d;
    const p = getPartsInTimezone(d, timezone);
    return new Date(p.year, p.month - 1, p.day);
}

/** Check if two dates represent the same calendar day in the user's timezone. */
export function isSameDayInTimezone(d1: Date, d2: Date, timezone?: string): boolean {
    const p1 = getPartsInTimezone(d1, timezone);
    const p2 = getPartsInTimezone(d2, timezone);
    return p1.year === p2.year && p1.month === p2.month && p1.day === p2.day;
}

/** Check if a date is "today" in the user's timezone. */
export function isTodayInTimezone(date: Date, timezone?: string): boolean {
    return isSameDayInTimezone(date, new Date(), timezone);
}
