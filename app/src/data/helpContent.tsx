import React from "react";
import {
    Plus, Upload, Settings2, BarChart3, Target, Wallet, Grid3X3,
    ChevronLeft, ChevronRight, Search, MousePointerClick, Filter, Coins,
    Table, Gauge, BookOpen, Layers, LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { colors } from "@/styles/colors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const I = (Icon: React.ComponentType<any>) => (
    <span style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 3 }}>
        <Icon size={14} strokeWidth={2.5} />
    </span>
);

const kbd = (text: string) => (
    <span
        style={{
            display: "inline-block",
            padding: "0 5px",
            fontSize: "11px",
            fontWeight: 600,
            color: colors.fg.base,
            backgroundColor: colors.fill,
            borderRadius: "4px",
            border: `1px solid ${colors.border}`,
            fontFamily: "monospace",
            lineHeight: "18px",
        }}
    >
        {text}
    </span>
);

const strong = (text: string) => (
    <strong style={{ color: colors.fg.base, fontWeight: 600 }}>{text}</strong>
);

/** A glossary / column entry: bold term followed by a dim definition. */
const def = (term: string, definition: React.ReactNode) => (
    <div>
        <span style={{ color: colors.fg.base, fontWeight: 600 }}>{term}</span>
        <span> — {definition}</span>
    </div>
);

/** Wraps a list of lines with a tight vertical rhythm. */
const lines = (children: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
);

/** A compact term/definition list (glossaries, column references). */
const glossary = (children: React.ReactNode) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{children}</div>
);

export interface HelpSection {
    title: string;
    content: React.ReactNode;
    /** Optional icon shown in a tinted badge next to the section title. */
    icon?: LucideIcon;
    /** Accent color for the icon badge. Defaults to cyan. */
    accent?: string;
}

export interface PageHelp {
    title: string;
    /** One short line: what the page is for. */
    intro?: React.ReactNode;
    sections: HelpSection[];
}

export const helpContent: Record<string, PageHelp> = {
    transactions: {
        title: "Transacciones",
        intro: <>Todos tus ingresos y egresos, fila por fila.</>,
        sections: [
            {
                title: "Editar y navegar",
                icon: MousePointerClick,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>{I(Plus)}{strong("Nueva Transacción")} para crear una.</div>
                        <div>Click en la {strong("fecha")} para ver el mes con texto.</div>
                        <div>{kbd("Shift")} + click para seleccionar varias y usar acciones en lote.</div>
                    </>
                ),
            },
            {
                title: "Las columnas",
                icon: Table,
                accent: colors.accent.blue,
                content: glossary(
                    <>
                        {def("Fecha", "cuándo ocurrió.")}
                        {def("Tipo", "ingreso o egreso.")}
                        {def("Descripción", "el detalle del movimiento.")}
                        {def("Ctas.", "cuotas, si las tiene.")}
                        {def("Monto", "el importe.")}
                        {def("Mon.", "moneda: ARS o USD.")}
                        {def("T.C.", "tipo de cambio usado.")}
                        {def("Frec.", "FIJO (recurrente) o VAR (variable).")}
                        {def("Categoría", "el grupo al que pertenece.")}
                        {def("Método de pago", "el canal o cuenta.")}
                        {def("Est.", "pagado o pendiente; click para cambiarlo.")}
                        {def("Opciones", "editar o eliminar.")}
                    </>
                ),
            },
            {
                title: "Filtros y búsqueda",
                icon: Filter,
                accent: colors.accent.orange,
                content: lines(
                    <>
                        <div>Filtrá por fecha, tipo, categoría, canal, moneda y frecuencia.</div>
                        <div>{I(Search)}Buscá por descripción. Los filtros se mantienen entre páginas.</div>
                    </>
                ),
            },
        ],
    },

    analysis: {
        title: "Análisis",
        intro: <>Tus números clave del año, de un vistazo.</>,
        sections: [
            {
                title: "KPIs principales",
                icon: Wallet,
                accent: colors.accent.blue,
                content: lines(
                    <>
                        <div>Cuatro tarjetas: {strong("Patrimonio Neto")}, {strong("Ahorro Neto")}, {strong("Egresos")} e {strong("Ingresos")}.</div>
                        <div>Click en cualquiera para ver su evolución.</div>
                        <div>{kbd("YTD")} / {kbd("MTD")} alterna entre el año y el mes en curso.</div>
                    </>
                ),
            },
            {
                title: "Heatmap",
                icon: Grid3X3,
                accent: colors.accent.green,
                content: lines(
                    <>
                        <div>Gastos o ingresos por mes, por categoría o canal.</div>
                        <div>Tocá el título para alternar Egresos/Ingresos y Categoría/Canal.</div>
                        <div>Más color = más importe. Hover para el desglose.</div>
                    </>
                ),
            },
            {
                title: "Conceptos clave",
                icon: BookOpen,
                accent: colors.accent.orange,
                content: glossary(
                    <>
                        {def("YTD", "acumulado desde el 1 de enero.")}
                        {def("MTD", "acumulado del mes en curso.")}
                        {def("Patrimonio Neto", "lo que tenés menos lo que debés.")}
                    </>
                ),
            },
        ],
    },

    economic: {
        title: "Datos Económicos",
        intro: <>Cotizaciones del mercado argentino, en vivo.</>,
        sections: [
            {
                title: "Cotizaciones",
                icon: Coins,
                accent: colors.accent.green,
                content: lines(
                    <>
                        <div>Seis tarjetas que se actualizan solas:</div>
                        <div>{strong("Dólar")} (blue, oficial, MEP, CCL), {strong("USDT")}, {strong("BTC")}, {strong("ETH")}, {strong("Riesgo País")} e {strong("Inflación")}.</div>
                    </>
                ),
            },
            {
                title: "Tabla comparativa",
                icon: Table,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>Valores históricos de cada indicador.</div>
                        <div>{I(Search)}Filtrá y ordená por los encabezados.</div>
                    </>
                ),
            },
            {
                title: "Conceptos clave",
                icon: BookOpen,
                accent: colors.accent.orange,
                content: glossary(
                    <>
                        {def("Dólar MEP", "comprar un bono en pesos y venderlo en dólares; legal.")}
                        {def("CCL", "como el MEP, pero los dólares quedan en el exterior.")}
                        {def("Riesgo País", "sobretasa de la deuda argentina vs EE.UU., en puntos básicos.")}
                    </>
                ),
            },
        ],
    },

    evolution: {
        title: "Evolución",
        intro: <>Tus finanzas a lo largo del tiempo, en gráficos.</>,
        sections: [
            {
                title: "Grupos de gráficos",
                icon: Layers,
                accent: colors.accent.blue,
                content: lines(
                    <>
                        <div>{I(BarChart3)}{strong("Cash Flow & Capital")} — flujo, ahorro, acumulado y capital.</div>
                        <div>{I(BarChart3)}{strong("Real vs Planning vs LY")} — tu realidad vs el plan y el año anterior.</div>
                        <div>{I(BarChart3)}{strong("Composición & Detalle")} — gastos por categoría y canal.</div>
                    </>
                ),
            },
            {
                title: "Leer los gráficos",
                icon: LineChart,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>Expandí cualquier gráfico a pantalla completa.</div>
                        <div>Cambiá entre vista {strong("YTD")}, {strong("Mensual")} o {strong("Anual")}.</div>
                        <div>Click en la leyenda para mostrar u ocultar series.</div>
                    </>
                ),
            },
        ],
    },

    historical: {
        title: "Histórico",
        intro: <>Tu archivo mensual de meses cerrados.</>,
        sections: [
            {
                title: "Editar y navegar",
                icon: MousePointerClick,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>Click en el {strong("mes")} para verlo con texto.</div>
                        <div>Filtrá por mes para moverte por tu historia.</div>
                    </>
                ),
            },
            {
                title: "Las columnas",
                icon: Table,
                accent: colors.accent.blue,
                content: glossary(
                    <>
                        {def("Mes", "el período.")}
                        {def("Ingreso", "total, con su parte fija y variable.")}
                        {def("Egreso", "total, con su parte fija y variable.")}
                        {def("Ahorro", "ingreso menos egreso.")}
                        {def("T.C.", "tipo de cambio ARS/USD.")}
                        {def("Fuente", "si vino de Histórico o de Transacciones.")}
                        {def("Opciones", "editar o eliminar (solo filas de histórico).")}
                    </>
                ),
            },
            {
                title: "Importar CSV",
                icon: Upload,
                accent: colors.accent.green,
                content: lines(
                    <>
                        <div>{I(Upload)}{strong("Importar CSV")} para cargar movimientos desde un archivo.</div>
                        <div>El formato se reconoce automáticamente.</div>
                    </>
                ),
            },
        ],
    },

    metrics: {
        title: "Métricas",
        intro: <>Tu realidad mes a mes contra plan, forecast y año anterior.</>,
        sections: [
            {
                title: "Tarjetas resumen",
                icon: BarChart3,
                accent: colors.accent.green,
                content: lines(
                    <>
                        <div>Cuatro indicadores en tres ventanas: {kbd("MTD")}, {kbd("YTD")} y {kbd("FY")}.</div>
                        <div>Click en una tarjeta para ver su evolución y comparativas.</div>
                    </>
                ),
            },
            {
                title: "Tabla comparativa",
                icon: Table,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>Mes a mes: {strong("real")} vs plan, forecast y año anterior.</div>
                        <div>Detectá desvíos y de dónde vienen.</div>
                    </>
                ),
            },
            {
                title: "Conceptos clave",
                icon: BookOpen,
                accent: colors.accent.orange,
                content: glossary(
                    <>
                        {def("MTD / YTD", "acumulado del mes y del año.")}
                        {def("FY", "el año completo (proyectado si no terminó).")}
                        {def("Plan vs Forecast", "objetivo vs proyección realista.")}
                        {def("Desvío", "diferencia entre lo real y lo esperado.")}
                    </>
                ),
            },
        ],
    },

    planning: {
        title: "Planning",
        intro: <>Diseñá y proyectá tus próximos meses.</>,
        sections: [
            {
                title: "Forecast vs Plan",
                icon: Target,
                accent: colors.accent.blue,
                content: lines(
                    <>
                        <div>{I(BarChart3)}{strong("Forecast")} — proyección automática desde lo recurrente.</div>
                        <div>{I(Target)}{strong("Plan")} — tus metas mensuales, definidas a mano.</div>
                    </>
                ),
            },
            {
                title: "KPIs de planning",
                icon: Gauge,
                accent: colors.accent.purple,
                content: lines(
                    <>
                        <div>{strong("Capital")}, {strong("Ahorro")}, {strong("Egresos")} e {strong("Ingresos")}: proyectado vs objetivo.</div>
                        <div>Cada KPI muestra su variación porcentual.</div>
                    </>
                ),
            },
            {
                title: "Tablas de conceptos",
                icon: Table,
                accent: colors.accent.cyan,
                content: lines(
                    <>
                        <div>{strong("Forecast")}: {I(Plus)}{strong("Nueva Línea")} agrega conceptos editables mes a mes.</div>
                        <div>{strong("Plan")}: {I(Plus)}{strong("Generar Plan")} crea metas por mes, editables celda por celda.</div>
                    </>
                ),
            },
            {
                title: "Configuración",
                icon: Settings2,
                accent: colors.accent.orange,
                content: lines(
                    <>
                        <div>{I(Settings2)}Capital inicial y tipos de cambio proyectados.</div>
                        <div>{I(ChevronLeft)}{I(ChevronRight)}Navegá entre años con las flechas.</div>
                    </>
                ),
            },
        ],
    },
};
