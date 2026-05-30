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

export function getTransactionDatePresets(timezone?: string): DatePreset[] {
    const p = getPartsInTimezone(new Date(), timezone);
    const year = p.year;
    const month = p.month; // 1-based
    const day = p.day;

    const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const startOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endOfMonthStr = formatISODateInTimezone(new Date(year, month, 0), timezone);

    const lastMonth = month - 1;
    const lastMonthYear = lastMonth < 1 ? year - 1 : year;
    const lastMonthIndex = lastMonth < 1 ? 12 : lastMonth;
    const lastMonthStartStr = `${lastMonthYear}-${String(lastMonthIndex).padStart(2, "0")}-01`;
    const lastMonthEndStr = formatISODateInTimezone(new Date(lastMonthYear, lastMonthIndex, 0), timezone);

    let threeMonthsAgoMonth = month - 3;
    let threeMonthsAgoYear = year;
    if (threeMonthsAgoMonth < 1) {
        threeMonthsAgoMonth += 12;
        threeMonthsAgoYear -= 1;
    }
    const threeMonthsAgoStr = `${threeMonthsAgoYear}-${String(threeMonthsAgoMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const nextMonth = month + 1;
    const nextMonthYear = nextMonth > 12 ? year + 1 : year;
    const nextMonthIndex = nextMonth > 12 ? 1 : nextMonth;
    const nextMonthStartStr = `${nextMonthYear}-${String(nextMonthIndex).padStart(2, "0")}-01`;
    const nextMonthEndStr = formatISODateInTimezone(new Date(nextMonthYear, nextMonthIndex, 0), timezone);

    const threeMonthsEndMonth = month + 2;
    const threeMonthsEndYear = threeMonthsEndMonth > 12 ? year + 1 : year;
    const threeMonthsEndMonthIndex = threeMonthsEndMonth > 12 ? threeMonthsEndMonth - 12 : threeMonthsEndMonth;
    const threeMonthsEndStr = formatISODateInTimezone(new Date(threeMonthsEndYear, threeMonthsEndMonthIndex, 0), timezone);

    return [
        { label: "Este mes", from: startOfMonthStr, to: endOfMonthStr },
        { label: "Desde este mes", from: startOfMonthStr, to: "" },
        { label: "Próximo mes", from: nextMonthStartStr, to: nextMonthEndStr },
        { label: "Próximos 3 meses", from: startOfMonthStr, to: threeMonthsEndStr },
        { label: "Mes anterior", from: lastMonthStartStr, to: lastMonthEndStr },
        { label: "Últimos 3 meses", from: threeMonthsAgoStr, to: todayStr },
    ];
}

export function getHistoricalDatePresets(timezone?: string): DatePreset[] {
    const p = getPartsInTimezone(new Date(), timezone);
    const year = p.year;
    const month = p.month; // 1-based

    const startOfThisYearStr = `${year}-01-01`;
    const endOfThisYearStr = `${year}-12-31`;
    const startOfMonthStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const endOfMonthStr = formatISODateInTimezone(new Date(year, month, 0), timezone);

    const prevYearStartStr = `${year - 1}-01-01`;
    const prevYearEndStr = `${year - 1}-12-31`;

    return [
        { label: "Este año", from: startOfThisYearStr, to: endOfThisYearStr },
        { label: "Este mes", from: startOfMonthStr, to: endOfMonthStr },
        { label: "Año anterior", from: prevYearStartStr, to: prevYearEndStr },
    ].sort((a, b) => b.from.localeCompare(a.from));
}

/* ─── Timezone-aware helpers ─── */

// Cache one Intl.DateTimeFormat per timezone — construction is far costlier than formatToParts,
// and this runs per calendar-day cell (DatePicker) and in same-day/today comparisons.
const tzFormatters = new Map<string, Intl.DateTimeFormat>();
function getTzFormatter(timezone?: string): Intl.DateTimeFormat {
    const key = timezone || "";
    let fmt = tzFormatters.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone || undefined,
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        });
        tzFormatters.set(key, fmt);
    }
    return fmt;
}

export function getPartsInTimezone(date: Date, timezone?: string) {
    try {
        const fmt = getTzFormatter(timezone);
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
    } catch {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds(),
        };
    }
}

/** Create a local Date that represents a specific calendar day in the user's timezone. */
export function createDateForDayInTimezone(year: number, month: number, day: number, timezone?: string): Date {
    if (!timezone) return new Date(year, month, day);
    let d = new Date(year, month, day);
    for (let i = 0; i < 3; i++) {
        const p = getPartsInTimezone(d, timezone);
        const diff = day - p.day;
        if (diff === 0) break;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }
    return d;
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
    return createDateForDayInTimezone(year, month - 1, day, timezone);
}

/** Format a Date as YYYY-MM-DD using the user's timezone. */
export function formatISODateInTimezone(date: Date, timezone?: string): string {
    const p = getPartsInTimezone(date, timezone);
    const y = String(p.year);
    const m = String(p.month).padStart(2, "0");
    const d = String(p.day).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Format a Date using the user's timezone. */
export function formatDateInTimezone(date: Date, format: DateFormat, timezone?: string): string {
    const p = getPartsInTimezone(date, timezone);
    const y = String(p.year);
    const m = String(p.month).padStart(2, "0");
    const d = String(p.day).padStart(2, "0");

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
