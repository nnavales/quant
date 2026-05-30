import { useState, useRef, useEffect } from "react";
import { colors } from "@/styles/colors";
import { spacing, radius, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { parseLocalDateInTimezone, formatDateInTimezone, getDateFormat, getNowInTimezone, isTodayInTimezone, isSameDayInTimezone, formatISODateInTimezone, createDateForDayInTimezone, getPartsInTimezone } from "@/utils/date";
import { useUserConfig, useClickOutside, useDropdownPosition } from "@/hooks";
import { ChevronLeft, ChevronRight, X, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { flexBetween, flexRow, truncate } from "@/styles/layout";

interface DatePickerProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    triggerStyle?: React.CSSProperties;
    showIcon?: boolean;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getDaysInMonth(year: number, month: number, timezone?: string): (Date | null)[] {
    const days: (Date | null)[] = [];
    const firstDay = timezone ? createDateForDayInTimezone(year, month, 1, timezone) : new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(timezone ? createDateForDayInTimezone(year, month, i, timezone) : new Date(year, month, i));
    return days;
}

function isSameDay(d1: Date, d2: Date, timezone?: string): boolean {
    return isSameDayInTimezone(d1, d2, timezone);
}

function isToday(date: Date, timezone?: string): boolean {
    return isTodayInTimezone(date, timezone);
}

function ChipSelect({
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
    const menuRef = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && menuRef.current) {
            const selectedEl = menuRef.current.querySelector("[data-selected]");
            if (selectedEl) selectedEl.scrollIntoView({ block: "center" });
        }
    }, [isOpen]);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...flexBetween,
                    gap: spacing[1],
                    padding: "0 8px",
                    height: "26px",
                    backgroundColor: colors.fill,
                    borderRadius: "8px",
                    color: colors.fg.base,
                    fontSize: fonts.size.sm,
                    fontFamily: fonts.family,
                    fontWeight: fonts.weight.medium,
                    cursor: "pointer",
                    minWidth: width,
                    border: "none",
                    boxSizing: "border-box",
                }}
            >
                <span>{selected?.label}</span>
                <ChevronDown
                    size={12}
                    style={{
                        color: colors.fg.dim,
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.15s",
                        flexShrink: 0,
                    }}
                />
            </div>
            {isOpen && (
                <div
                    ref={menuRef}
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "4px",
                        backgroundColor: colors.bg.surface,
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: shadows.lg,
                        zIndex: 10,
                        minWidth: "100%",
                        padding: spacing[1],
                        maxHeight: "200px",
                        overflowY: "auto",
                        overscrollBehavior: "contain",
                    }}
                >
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            data-selected={opt.value === value ? "" : undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: `4px 8px`,
                                fontSize: fonts.size.sm,
                                cursor: "pointer",
                                borderRadius: "8px",
                                backgroundColor: opt.value === value ? colors.fill : "transparent",
                                color: colors.fg.base,
                                transition: "background-color 0.1s",
                            }}
                            onMouseEnter={(e) => {
                                if (opt.value !== value) e.currentTarget.style.backgroundColor = colors.fill;
                            }}
                            onMouseLeave={(e) => {
                                if (opt.value !== value) e.currentTarget.style.backgroundColor = "transparent";
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
                <span style={{ ...flexRow, gap: spacing[2], flex: 1, overflow: "hidden" }}>
                    {showIcon && <CalendarIcon size={16} style={{ flexShrink: 0, color: colors.fg.dim }} />}
                    <span style={{...truncate, flex: 1, fontSize: fonts.size.sm}}>
                        {selectedDate ? formatDateInTimezone(selectedDate, userDateFormat, tz) : placeholder}
                    </span>
                </span>
                {showIcon && (selectedDate ? (
                    <X size={14} style={{ color: colors.fg.dim, cursor: "pointer", flexShrink: 0 }} onClick={handleClear} />
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
                        border: "none",
                        borderRadius: "8px",
                        padding: spacing[2],
                        boxShadow: shadows.lg,
                    }}
                >
                    <div
                        style={{
                            ...flexBetween,
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
                                borderRadius: "8px",
                                transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div style={{ display: "flex", gap: spacing[2] }}>
                            <ChipSelect value={month} options={monthOptions} onChange={(v) => setViewDate(tz ? createDateForDayInTimezone(year, v, 1, tz) : new Date(year, v, 1))} width="110px" />
                            <ChipSelect value={year} options={yearOptions} onChange={(v) => setViewDate(tz ? createDateForDayInTimezone(v, month, 1, tz) : new Date(v, month, 1))} width="70px" />
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
                                borderRadius: "8px",
                                transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 34px)", gap: "2px" }}>
                        {WEEKDAYS.map((day) => (
                            <div
                                key={day}
                                style={{
                                    ...flexRow,
                                    justifyContent: "center",
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.semibold,
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
                                    onClick={(e) => { e.stopPropagation(); handleSelect(day); }}
                                    style={{
                                        ...flexRow,
                                        justifyContent: "center",
                                        width: "34px",
                                        height: "34px",
                                        fontSize: fonts.size.sm,
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        backgroundColor: selectedDate && isSameDay(day, selectedDate, tz)
                                            ? colors.accent.cyan
                                            : "transparent",
                                        color: selectedDate && isSameDay(day, selectedDate, tz)
                                            ? colors.bg.base
                                            : isToday(day, tz)
                                                ? colors.accent.cyan
                                                : colors.fg.base,
                                        fontWeight: (selectedDate && isSameDay(day, selectedDate, tz)) || isToday(day, tz) ? fonts.weight.semibold : fonts.weight.regular,
                                        transition: "background-color 0.1s",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!(selectedDate && isSameDay(day, selectedDate, tz)))
                                            e.currentTarget.style.backgroundColor = colors.fill;
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!(selectedDate && isSameDay(day, selectedDate, tz)))
                                            e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    {tz ? getPartsInTimezone(day, tz).day : day.getDate()}
                                </div>
                            ) : (
                                <div key={idx} style={{ width: "34px", height: "34px" }} />
                            )
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}
