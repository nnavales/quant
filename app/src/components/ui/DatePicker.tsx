import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { ChevronLeft, ChevronRight, X, ChevronDown, Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function getDaysInMonth(year: number, month: number): (Date | null)[] {
  const days: (Date | null)[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function hasOverflowAncestor(element: HTMLElement): boolean {
  let el = element.parentElement;
  while (el) {
    const style = window.getComputedStyle(el);
    if (style.overflow === "auto" || style.overflow === "scroll" || style.overflowY === "auto" || style.overflowY === "scroll") {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

function DropdownSelect({ value, options, onChange, width = "auto" }: { value: number; options: { value: number; label: string }[]; onChange: (v: number) => void; width?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

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
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing[1],
          padding: "4px 8px", backgroundColor: colors.bg.dim, border: `1px solid ${colors.highlight.high}`,
          borderRadius: radius.base, color: colors.fg.default, fontSize: "13px", cursor: "pointer", minWidth: width,
        }}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} style={{ color: colors.fg.muted, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </div>
      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: "2px",
          backgroundColor: colors.bg.surface, border: `1px solid ${colors.highlight.high}`,
          borderRadius: radius.base, boxShadow: "0 4px 12px rgb(0 0 0 / 0.2)", zIndex: 10, maxHeight: "180px", overflowY: "auto", overscrollBehavior: "contain",
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
              style={{
                padding: "6px 10px", fontSize: "13px", cursor: "pointer",
                backgroundColor: opt.value === value ? colors.highlight.high : "transparent",
                color: colors.fg.default,
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.backgroundColor = colors.highlight.medium; }}
              onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DatePicker({ value, onChange, placeholder = "Seleccionar fecha" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const [usePortal, setUsePortal] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(value) : undefined;

  useEffect(() => {
    if (containerRef.current && isOpen) {
      setUsePortal(hasOverflowAncestor(containerRef.current));
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !usePortal) return;
    
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom + 4, left: rect.left });
      }
    };
    
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, usePortal]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setIsOpen(false);
  };

  const handleClick = () => setIsOpen(!isOpen);

  const prevMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)); };
  const nextMonth = (e: React.MouseEvent) => { e.stopPropagation(); setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)); };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = getDaysInMonth(year, month);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 51 }, (_, i) => ({ value: currentYear - 25 + i, label: String(currentYear - 25 + i) })).filter(o => o.value >= 2000);
  const monthOptions = MONTHS.map((m, idx) => ({ value: idx, label: m }));

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setViewDate(today);
    onChange(format(today, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const calendarPanel = (
    <div style={{ position: "absolute", top: "100%", left: 0, marginTop: spacing[1], zIndex: 1000, backgroundColor: colors.bg.surface, border: `1px solid ${colors.highlight.high}`, borderRadius: radius.lg, boxShadow: "0 10px 25px -3px rgb(0 0 0 / 0.3)", padding: spacing[3] }} onMouseDown={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[2] }}>
        <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", color: colors.fg.muted, cursor: "pointer", padding: "4px", display: "flex", borderRadius: radius.base }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ display: "flex", gap: spacing[2] }}>
          <DropdownSelect value={month} options={monthOptions} onChange={(v) => setViewDate(new Date(year, v, 1))} width="110px" />
          <DropdownSelect value={year} options={yearOptions} onChange={(v) => setViewDate(new Date(v, month, 1))} width="70px" />
        </div>
        <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", color: colors.fg.muted, cursor: "pointer", padding: "4px", display: "flex", borderRadius: radius.base }}>
          <ChevronRight size={18} />
        </button>
      </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gap: "2px" }}>
        {WEEKDAYS.map((day) => <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: colors.fg.muted, height: "28px" }}>{day}</div>)}
        {days.map((day, idx) => day ? (
          <div key={idx} onClick={(e) => { e.stopPropagation(); handleSelect(day); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", fontSize: "13px", borderRadius: radius.base, cursor: "pointer", backgroundColor: selectedDate && isSameDay(day, selectedDate) ? colors.accent.teal : "transparent", color: selectedDate && isSameDay(day, selectedDate) ? colors.bg.default : isToday(day) ? colors.accent.teal : colors.fg.default, fontWeight: selectedDate && isSameDay(day, selectedDate) || isToday(day) ? 600 : 400 }}>
            {day.getDate()}
          </div>
        ) : <div key={idx} style={{ width: "32px", height: "32px" }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: spacing[2], paddingTop: spacing[2], borderTop: `1px solid ${colors.highlight.medium}` }}>
        <button type="button" onClick={handleToday} style={{ background: "transparent", border: "none", color: colors.accent.teal, fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "4px 8px", borderRadius: radius.base }}>Hoy</button>
      </div>
    </div>
  );

  const portalPanel = position && (
    <div style={{ position: "fixed", top: position.top, left: position.left, zIndex: 10000, backgroundColor: colors.bg.surface, border: `1px solid ${colors.highlight.high}`, borderRadius: radius.lg, boxShadow: "0 10px 25px -3px rgb(0 0 0 / 0.3)", padding: spacing[3] }} onMouseDown={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[2] }}>
        <button type="button" onClick={prevMonth} style={{ background: "transparent", border: "none", color: colors.fg.muted, cursor: "pointer", padding: "4px", display: "flex", borderRadius: radius.base }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ display: "flex", gap: spacing[2] }}>
          <DropdownSelect value={month} options={monthOptions} onChange={(v) => setViewDate(new Date(year, v, 1))} width="110px" />
          <DropdownSelect value={year} options={yearOptions} onChange={(v) => setViewDate(new Date(v, month, 1))} width="70px" />
        </div>
        <button type="button" onClick={nextMonth} style={{ background: "transparent", border: "none", color: colors.fg.muted, cursor: "pointer", padding: "4px", display: "flex", borderRadius: radius.base }}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 32px)", gap: "2px" }}>
        {WEEKDAYS.map((day) => <div key={day} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: colors.fg.muted, height: "28px" }}>{day}</div>)}
        {days.map((day, idx) => day ? (
          <div key={idx} onClick={(e) => { e.stopPropagation(); handleSelect(day); }} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", fontSize: "13px", borderRadius: radius.base, cursor: "pointer", backgroundColor: selectedDate && isSameDay(day, selectedDate) ? colors.accent.teal : "transparent", color: selectedDate && isSameDay(day, selectedDate) ? colors.bg.default : isToday(day) ? colors.accent.teal : colors.fg.default, fontWeight: selectedDate && isSameDay(day, selectedDate) || isToday(day) ? 600 : 400 }}>
            {day.getDate()}
          </div>
        ) : <div key={idx} style={{ width: "32px", height: "32px" }} />)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: spacing[2], paddingTop: spacing[2], borderTop: `1px solid ${colors.highlight.medium}` }}>
        <button type="button" onClick={handleToday} style={{ background: "transparent", border: "none", color: colors.accent.teal, fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "4px 8px", borderRadius: radius.base }}>Hoy</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div onClick={handleClick} style={{ display: "flex", alignItems: "center", gap: spacing[2], padding: "6px 12px", backgroundColor: colors.bg.dim, border: `1px solid ${colors.highlight.medium}`, borderRadius: radius.md, cursor: "pointer", color: selectedDate ? colors.fg.default : colors.fg.muted, height: "36px" }}>
        <CalendarIcon size={16} style={{ flexShrink: 0, color: colors.fg.muted }} />
        <span style={{ flex: 1, fontSize: "14px" }}>{selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : placeholder}</span>
        {selectedDate && <X size={14} style={{ color: colors.fg.muted, cursor: "pointer" }} onClick={handleClear} />}
      </div>
      {isOpen && (usePortal && portalPanel ? createPortal(portalPanel, document.body) : !usePortal && calendarPanel)}
    </div>
  );
}
