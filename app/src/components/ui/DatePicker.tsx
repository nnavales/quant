import { useState, useRef, useEffect } from "react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { parseLocalDateInTimezone, formatDateInTimezone, getDateFormat, getNowInTimezone, isTodayInTimezone, isSameDayInTimezone, formatISODateInTimezone, createDateForDayInTimezone, getPartsInTimezone } from "@/utils/date";
import { useUserConfig, useClickOutside, useDropdownPosition } from "@/hooks";
import { ChevronLeft, ChevronRight, X, ChevronDown, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    triggerStyle?: React.CSSProperties;
    showIcon?: boolean;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

function getDaysInMonth(year: number, month: number, timezone?: string): (Date | null)[] {
    const days: (Date | null)[] = [];
    const firstDay = timezone ? createDateForDayInTimezone(year, month, 1, timezone) : new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
    }

    for (let i = 1; i <= totalDays; i++) {
        days.push(timezone ? createDateForDayInTimezone(year, month, i, timezone) : new Date(year, month, i));
    }

    return days;
}

function isSameDay(d1: Date, d2: Date, timezone?: string): boolean {
    return isSameDayInTimezone(d1, d2, timezone);
}

function isToday(date: Date, timezone?: string): boolean {
    return isTodayInTimezone(date, timezone);
}

function DropdownSelect({
    value,
    options,
    onChange,
    width = "auto",
}: {
    value: number;
    options: { value: number; label: string }[];
    onChange: (v: number) => void;
    width?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing[1],
                    padding: "4px 8px",
                    backgroundColor: colors.bg.surface,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.base,
                    color: colors.fg.base,
                    fontSize: "13px",
                    cursor: "pointer",
                    minWidth: width,
                }}
            >
                <span>{selected?.label}</span>
                <ChevronDown
                    size={14}
                    style={{
                        color: colors.fg.dim,
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                    }}
                />
            </div>
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "2px",
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.base,
                        zIndex: 10,
                        maxHeight: "180px",
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                    }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: "6px 10px",
                                fontSize: "13px",
                                cursor: "pointer",
                                backgroundColor:
                                    opt.value === value ? colors.fill : "transparent",
                                color: colors.fg.base,
                            }}
                            onMouseEnter={(e) => {
                                if (opt.value !== value)
                                    e.currentTarget.style.backgroundColor = colors.fill;
                            }}
                            onMouseLeave={(e) => {
                                if (opt.value !== value)
                                    e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Seleccionar fecha",
    triggerStyle,
    showIcon = true,
}: DatePickerProps) {
    const { data: userConfig } = useUserConfig();
    const tz = userConfig?.timezone;
    const userDateFormat = getDateFormat(userConfig?.date_format);

    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => (value ? parseLocalDateInTimezone(value, tz) : getNowInTimezone(tz)));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setViewDate(value ? parseLocalDateInTimezone(value, tz) : getNowInTimezone(tz));
    }, [value, tz]);
    const panelRef = useRef<HTMLDivElement>(null);
    const selectedDate = value ? parseLocalDateInTimezone(value, tz) : undefined;

    useClickOutside(containerRef, () => setIsOpen(false));
    useDropdownPosition(containerRef, panelRef, isOpen, { maxHeight: 360 });

    const handleSelect = (date: Date) => {
        onChange(formatISODateInTimezone(date, tz));
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setIsOpen(false);
    };

    const handleClick = () => setIsOpen(!isOpen);

    const viewParts = tz ? getPartsInTimezone(viewDate, tz) : null;
    const year = viewParts?.year ?? viewDate.getFullYear();
    const month = (viewParts?.month ?? viewDate.getMonth() + 1) - 1;
    const days = getDaysInMonth(year, month, tz);

    const prevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(tz ? createDateForDayInTimezone(year, month - 1, 1, tz) : new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };
    const nextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(tz ? createDateForDayInTimezone(year, month + 1, 1, tz) : new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const nowParts = tz ? getPartsInTimezone(getNowInTimezone(tz), tz) : null;
    const currentYear = nowParts?.year ?? getNowInTimezone(tz).getFullYear();
    const yearOptions = Array.from({ length: 51 }, (_, i) => ({
        value: currentYear - 25 + i,
        label: String(currentYear - 25 + i),
    })).filter((o) => o.value >= 2000);
    const monthOptions = MONTHS.map((m, idx) => ({ value: idx, label: m }));

    const handleToday = (e: React.MouseEvent) => {
        e.stopPropagation();
        const today = getNowInTimezone(tz);
        setViewDate(today);
        onChange(formatISODateInTimezone(today, tz));
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
            <div
                onClick={handleClick}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing[2],
                    padding: `0 ${spacing[2]}`,
                    backgroundColor: colors.bg.base,
                    border: `1px solid ${colors.fill}`,
                    borderRadius: radius.md,
                    cursor: "pointer",
                    color: selectedDate ? colors.fg.base : colors.fg.dim,
                    height: "40px",
                    fontSize: fonts.size.sm,
                    boxSizing: "border-box",
                    outline: "none",
                    width: "100%",
                    transition: "border-color 0.15s",
                    ...triggerStyle,
                }}

            >
                <span style={{ display: "flex", alignItems: "center", gap: spacing[2], flex: 1, overflow: "hidden" }}>
                    {showIcon && <CalendarIcon size={16} style={{ flexShrink: 0, color: colors.fg.dim }} />}
                    <span style={{ flex: 1, fontSize: fonts.size.sm, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedDate
                            ? formatDateInTimezone(selectedDate, userDateFormat, tz)
                            : placeholder}
                    </span>
                </span>
                {showIcon && (selectedDate ? (
                    <X
                        size={14}
                        style={{ color: colors.fg.dim, cursor: "pointer", flexShrink: 0 }}
                        onClick={handleClear}
                    />
                ) : (
                    <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
                ))}
            </div>
            {isOpen && (
                <div
                    ref={panelRef}
                    style={{
                        position: "fixed",
                        visibility: "hidden",
                        zIndex: 1000,
                        backgroundColor: colors.bg.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.lg,
                        padding: spacing[3],
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: spacing[2],
                        }}
                    >
                        <button
                            type="button"
                            onClick={prevMonth}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: colors.fg.dim,
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                borderRadius: radius.base,
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ display: "flex", gap: spacing[2] }}>
                            <DropdownSelect
                                value={month}
                                options={monthOptions}
                                onChange={(v) => setViewDate(tz ? createDateForDayInTimezone(year, v, 1, tz) : new Date(year, v, 1))}
                                width="110px"
                            />
                            <DropdownSelect
                                value={year}
                                options={yearOptions}
                                onChange={(v) => setViewDate(tz ? createDateForDayInTimezone(v, month, 1, tz) : new Date(v, month, 1))}
                                width="70px"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={nextMonth}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: colors.fg.dim,
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                borderRadius: radius.base,
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gap: "2px" }}>
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: colors.fg.dim,
                                    height: "28px",
                                }}
                            >
                                {day}
                            </div>
                        ))}
                        {days.map((day, idx) =>
                            day ? (
                                <div
                                    key={idx}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(day);
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "32px",
                                        height: "32px",
                                        fontSize: "13px",
                                        borderRadius: radius.base,
                                        cursor: "pointer",
                                        backgroundColor:
                                            selectedDate && isSameDay(day, selectedDate, tz)
                                                ? colors.accent.teal
                                                : "transparent",
                                        color:
                                            selectedDate && isSameDay(day, selectedDate, tz)
                                                ? colors.bg.base
                                                : isToday(day, tz)
                                                  ? colors.accent.teal
                                                  : colors.fg.base,
                                        fontWeight:
                                            (selectedDate && isSameDay(day, selectedDate, tz)) || isToday(day, tz)
                                                ? 600
                                                : 400,
                                    }}
                                >
                                    {tz ? getPartsInTimezone(day, tz).day : day.getDate()}
                                </div>
                            ) : (
                                <div key={idx} style={{ width: "32px", height: "32px" }} />
                            )
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: spacing[2],
                            paddingTop: spacing[2],
                            borderTop: `1px solid ${colors.fill}`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={handleToday}
                            style={{
                                backgroundColor: colors.variant.teal.bg,
                                border: `1px solid ${colors.variant.teal.border}`,
                                color: colors.accent.teal,
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: radius.base,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.variant.teal.hoverBg; e.currentTarget.style.borderColor = colors.variant.teal.hoverBorder; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.variant.teal.bg; e.currentTarget.style.borderColor = colors.variant.teal.border; }}
                        >
                            Hoy
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
