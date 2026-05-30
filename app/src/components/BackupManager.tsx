import { useState, useRef } from "react";
import { useExportBackup, useImportBackup } from "@/hooks";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Modal, ModalContent, ModalCloseButton } from "@/components/ui/Modal";
import { Download, FileUp, HelpCircle } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { CustomSelect } from "@/components/ui/Select";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import { SettingsCard } from "@/components/SettingsCard";
import { flexBetween, flexColumn, flexRow } from "@/styles/layout";

const resourceOptions = [
    { id: "transactions" as const, label: "Transacciones" },
    { id: "historical" as const, label: "Datos históricos" },
    { id: "networth" as const, label: "Patrimonio" },
    { id: "presets" as const, label: "Plantillas" },
    { id: "planning-inputs" as const, label: "Forecast" },
    { id: "planning-goals" as const, label: "Plan" },
    { id: "planning-exchange-rates" as const, label: "Planning - Cotizaciones" },
    { id: "planning-config" as const, label: "Planning - Capital Inicial" },
];

type ResourceId = (typeof resourceOptions)[number]["id"];

const csvDocs: Record<string, { columns: string; description: React.ReactNode; example: string }> =
    {
        "planning-inputs": {
            columns:
                "year,description,type,currency,january,february,march,april,may,june,july,august,september,october,november,december",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>year</strong>: año (ej: 2026)
                    </li>
                    <li>
                        <strong>description</strong>: descripción del item (máx 50 caracteres)
                    </li>
                    <li>
                        <strong>type</strong>: <code style={{ color: colors.fg.base }}>income</code>{" "}
                        o <code style={{ color: colors.fg.base }}>expense</code>
                    </li>
                    <li>
                        <strong>currency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>ARS</code> o{" "}
                        <code style={{ color: colors.fg.base }}>USD</code>
                    </li>
                    <li>
                        <strong>january</strong> a <strong>december</strong>: montos mensuales en
                        centavos (enteros)
                    </li>
                </ul>
            ),
            example:
                "2026,Alquiler,expense,ARS,150000,150000,150000,150000,150000,150000,150000,150000,150000,150000,150000,150000",
        },
        "planning-goals": {
            columns:
                "year,metric,january,february,march,april,may,june,july,august,september,october,november,december",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>year</strong>: año (ej: 2026)
                    </li>
                    <li>
                        <strong>metric</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>income</code> o{" "}
                        <code style={{ color: colors.fg.base }}>expense</code>
                    </li>
                    <li>
                        <strong>january</strong> a <strong>december</strong>: metas mensuales en
                        centavos (enteros)
                    </li>
                </ul>
            ),
            example:
                "2026,income,500000,500000,500000,500000,500000,500000,500000,500000,500000,500000,500000,500000",
        },
        "planning-exchange-rates": {
            columns: "month,rate",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>month</strong>: formato YYYY-MM (ej: 2026-01)
                    </li>
                    <li>
                        <strong>rate</strong>: tipo de cambio ARS/USD
                    </li>
                </ul>
            ),
            example: "2026-01,1200.50",
        },
        "planning-config": {
            columns: "year,initial_capital",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>year</strong>: año (ej: 2026)
                    </li>
                    <li>
                        <strong>initial_capital</strong>: capital inicial en centavos
                    </li>
                </ul>
            ),
            example: "2026,10000000",
        },
        historical: {
            columns:
                "month,income,income_variable,income_fixed,expense,expense_fixed,expense_variable,exchange_rate,savings,source",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>month</strong>: formato YYYY-MM (ej: 2025-01)
                    </li>
                    <li>
                        <strong>income / expense</strong>: totales en USD. Deben ser la suma de sus
                        componentes:{" "}
                        <code style={{ color: colors.fg.base }}>
                            income = income_fixed + income_variable
                        </code>{" "}
                        y{" "}
                        <code style={{ color: colors.fg.base }}>
                            expense = expense_fixed + expense_variable
                        </code>
                    </li>
                    <li>
                        <strong>income_fixed / expense_fixed</strong>: parte fija en USD
                    </li>
                    <li>
                        <strong>income_variable / expense_variable</strong>: parte variable en USD
                    </li>
                    <li>
                        <strong>exchange_rate</strong>: tipo de cambio ARS/USD, mayor a 0
                    </li>
                    <li>
                        <strong>savings</strong>: ahorro neto del mes en USD
                    </li>
                    <li>
                        <strong>source</strong>: siempre{" "}
                        <code style={{ color: colors.fg.base }}>historical</code>
                    </li>
                </ul>
            ),
            example: "2025-01,1116,153,964,1316,835,481,1165,-200,historical",
        },
        transactions: {
            columns:
                "date,description,installment_number,total_installments,group_id,type,frequency,is_done,exchange_rate,amount_ars,amount_usd,currency,category,subcategory,channel,account",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>date</strong>: fecha en formato ISO YYYY-MM-DD
                    </li>
                    <li>
                        <strong>description</strong>: descripción de la transacción
                    </li>
                    <li>
                        <strong>installment_number / total_installments / group_id</strong>: dejar
                        vacío si no es cuota. Si es cuota: generá un{" "}
                        <code style={{ color: colors.fg.base }}>group_id</code> único para agrupar
                        todas las cuotas de ese grupo, poné el número de esta cuota en{" "}
                        <code style={{ color: colors.fg.base }}>installment_number</code> y el total
                        de cuotas en{" "}
                        <code style={{ color: colors.fg.base }}>total_installments</code>
                    </li>
                    <li>
                        <strong>type</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>expense</code> o{" "}
                        <code style={{ color: colors.fg.base }}>income</code>
                    </li>
                    <li>
                        <strong>frequency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>variable</code> o{" "}
                        <code style={{ color: colors.fg.base }}>fixed</code>
                    </li>
                    <li>
                        <strong>is_done</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>true</code> o{" "}
                        <code style={{ color: colors.fg.base }}>false</code>
                    </li>
                    <li>
                        <strong>exchange_rate</strong>: tipo de cambio ARS/USD al momento de la
                        transacción
                    </li>
                    <li>
                        <strong>amount_ars / amount_usd</strong>: montos en ARS y USD
                    </li>
                    <li>
                        <strong>currency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>ARS</code> o{" "}
                        <code style={{ color: colors.fg.base }}>USD</code>
                    </li>
                    <li>
                        <strong>category / subcategory</strong>: nombre de categoría y subcategoría
                    </li>
                    <li>
                        <strong>channel / account</strong>: nombre del canal y cuenta
                    </li>
                </ul>
            ),
            example:
                "2025-01-15,Supermercado,,,,expense,variable,true,1200,15000,12.5,ARS,Alimentos,Verduleria,Efectivo,Billetera",
        },
        networth: {
            columns: "name,amount,currency,type",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>name</strong>: nombre del activo o cuenta
                    </li>
                    <li>
                        <strong>amount</strong>: monto en la moneda indicada
                    </li>
                    <li>
                        <strong>currency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>ARS</code> o{" "}
                        <code style={{ color: colors.fg.base }}>USD</code>
                    </li>
                    <li>
                        <strong>type</strong>: <code style={{ color: colors.fg.base }}>liquid</code>{" "}
                        o <code style={{ color: colors.fg.base }}>physical</code>
                    </li>
                </ul>
            ),
            example: "Billetera USD,3500,USD,liquid",
        },
        presets: {
            columns:
                "name,description,type,frequency,category,subcategory,channel,account,is_done,currency",
            description: (
                <ul
                    style={{
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        margin: 0,
                        paddingLeft: spacing[4],
                        lineHeight: 1.6,
                    }}
                >
                    <li>
                        <strong>name</strong>: nombre de la plantilla
                    </li>
                    <li>
                        <strong>description</strong>: descripción
                    </li>
                    <li>
                        <strong>type</strong>: <code style={{ color: colors.fg.base }}>income</code>{" "}
                        o <code style={{ color: colors.fg.base }}>expense</code>
                    </li>
                    <li>
                        <strong>frequency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>fixed</code> o{" "}
                        <code style={{ color: colors.fg.base }}>variable</code>
                    </li>
                    <li>
                        <strong>category / subcategory</strong>: nombre de categoría y subcategoría
                    </li>
                    <li>
                        <strong>channel / account</strong>: nombre del canal y cuenta
                    </li>
                    <li>
                        <strong>is_done</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>true</code> o{" "}
                        <code style={{ color: colors.fg.base }}>false</code>
                    </li>
                    <li>
                        <strong>currency</strong>:{" "}
                        <code style={{ color: colors.fg.base }}>ARS</code> o{" "}
                        <code style={{ color: colors.fg.base }}>USD</code>
                    </li>
                </ul>
            ),
            example: "Sueldo,,income,fixed,,,Transferencia,Cuenta sueldo,false,ARS",
        },
    };

export function BackupManager() {
    const [selectedResource, setSelectedResource] = useState<ResourceId>("transactions");
    const [showDocs, setShowDocs] = useState(false);
    const [docTab, setDocTab] = useState<ResourceId>("historical");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportMutation = useExportBackup();
    const importMutation = useImportBackup();

    const handleExport = () => {
        exportMutation.mutate(undefined, {
            onSuccess: async (response) => {
                const fileName = `quant-backup-${new Date().toISOString().split("T")[0]}.zip`;

                try {
                    const downloads = await downloadDir();
                    const path = await save({
                        defaultPath: `${downloads}/${fileName}`,
                        filters: [{ name: "ZIP", extensions: ["zip"] }],
                    });

                    if (!path) {
                        return;
                    }

                    const blob = new Blob([response.data], { type: "application/zip" });
                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);

                    await writeFile(path, uint8Array);
                    toast("Backup guardado correctamente", "success");
                } catch (err) {
                    toast(getApiErrorMessage(err));
                }
            },
            onError: (err: unknown) => {
                toast(getApiErrorMessage(err));
            },
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        importMutation.mutate(
            { resource: selectedResource, file },
            {
                onSuccess: () => {
                    toast(
                        `${resourceOptions.find((r) => r.id === selectedResource)?.label} importado correctamente`,
                        "success"
                    );
                    if (fileInputRef.current) fileInputRef.current.value = "";
                },
                onError: (err: unknown) => {
                    toast(getApiErrorMessage(err));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                },
            }
        );
    };

    const doc = csvDocs[docTab];

    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            <SettingsCard title="Exportar datos">
                <p
                    style={{
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        marginBottom: spacing[3],
                    }}
                >
                    Guarda un archivo ZIP con todas tus transacciones, datos históricos y
                    patrimonio.
                </p>
                <button
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    onMouseEnter={(e) => {
                        if (!exportMutation.isPending) e.currentTarget.style.color = colors.fg.base;
                    }}
                    onMouseLeave={(e) => {
                        if (!exportMutation.isPending) e.currentTarget.style.color = colors.fg.dim;
                    }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: spacing[2],
                        backgroundColor: colors.bg.surface,
                        border: "none",
                        borderRadius: radius.md,
                        height: "32px",
                        padding: `0 ${spacing[3]}`,
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        fontFamily: fonts.family,
                        fontWeight: fonts.weight.medium,
                        cursor: exportMutation.isPending ? "not-allowed" : "pointer",
                        opacity: exportMutation.isPending ? 0.5 : 1,
                        transition: "color 0.15s",
                        whiteSpace: "nowrap",
                    }}
                >
                    <Download size={16} />
                    {exportMutation.isPending ? "Exportando..." : "Exportar backup"}
                </button>
            </SettingsCard>

            <SettingsCard>
                <div style={{ ...flexBetween, marginBottom: spacing[3] }}>
                    <h3
                        style={{
                            fontSize: fonts.size.xs,
                            fontWeight: fonts.weight.semibold,
                            color: colors.fg.dim,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            margin: 0,
                        }}
                    >
                        Importar datos
                    </h3>
                    <button
                        onClick={() => setShowDocs(true)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = colors.fg.base;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = colors.fg.dim;
                        }}
                        style={{
                            background: "none",
                            border: "none",
                            color: colors.fg.dim,
                            cursor: "pointer",
                            ...flexRow,
                            gap: spacing[1],
                            fontSize: fonts.size.sm,
                            padding: spacing[1],
                            borderRadius: radius.sm,
                            transition: "color 0.15s",
                        }}
                        title="Ver formato CSV"
                    >
                        <HelpCircle size={14} />
                        <span>Formato CSV</span>
                    </button>
                </div>
                <p
                    style={{
                        fontSize: fonts.size.sm,
                        color: colors.fg.dim,
                        marginBottom: spacing[3],
                        marginTop: spacing[2],
                    }}
                >
                    Selecciona el tipo de datos y el archivo CSV para importar.
                </p>

                <div
                    style={{
                        display: "flex",
                        gap: spacing[1],
                        marginBottom: spacing[3],
                        flexWrap: "wrap",
                    }}
                >
                    {resourceOptions.map((opt) => {
                        const isSelected = selectedResource === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setSelectedResource(opt.id)}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = colors.fg.dim;
                                        e.currentTarget.style.color = colors.fg.base;
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.borderColor = colors.border;
                                        e.currentTarget.style.color = colors.fg.dim;
                                    }
                                }}
                                style={{
                                    padding: `${spacing[0]} ${spacing[2]}`,
                                    borderRadius: radius.md,
                                    border: `1px solid ${isSelected ? `${colors.accent.cyan}30` : colors.border}`,
                                    backgroundColor: isSelected
                                        ? `${colors.accent.cyan}08`
                                        : "transparent",
                                    color: isSelected ? colors.accent.cyan : colors.fg.dim,
                                    fontSize: fonts.size.sm,
                                    fontWeight: isSelected
                                        ? fonts.weight.semibold
                                        : fonts.weight.medium,
                                    cursor: "pointer",
                                    fontFamily: fonts.family,
                                    transition: "all 0.15s",
                                    lineHeight: "26px",
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importMutation.isPending}
                    onMouseEnter={(e) => {
                        if (!importMutation.isPending) e.currentTarget.style.color = colors.fg.base;
                    }}
                    onMouseLeave={(e) => {
                        if (!importMutation.isPending) e.currentTarget.style.color = colors.fg.dim;
                    }}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: spacing[2],
                        backgroundColor: colors.bg.surface,
                        border: "none",
                        borderRadius: radius.md,
                        height: "32px",
                        padding: `0 ${spacing[3]}`,
                        color: colors.fg.dim,
                        fontSize: fonts.size.sm,
                        fontFamily: fonts.family,
                        fontWeight: fonts.weight.medium,
                        cursor: importMutation.isPending ? "not-allowed" : "pointer",
                        opacity: importMutation.isPending ? 0.5 : 1,
                        transition: "color 0.15s",
                        whiteSpace: "nowrap",
                    }}
                >
                    <FileUp size={16} />
                    {importMutation.isPending ? "Importando..." : "Seleccionar archivo CSV"}
                </button>
            </SettingsCard>

            <Modal isOpen={showDocs} onClose={() => setShowDocs(false)}>
                <ModalContent
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: 0,
                        maxWidth: "640px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                        overflow: "hidden",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: `${spacing[3]} ${spacing[3]} 0` }}>
                        <ModalCloseButton onClick={() => setShowDocs(false)} />
                    </div>
                    <div style={{ padding: spacing[5], paddingBottom: 0 }}>
                        <div
                            style={{
                                marginBottom: spacing[2],
                                fontSize: fonts.size.xs,
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.dim,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            Tipo de datos
                        </div>
                        <div style={{ marginBottom: spacing[5] }}>
                            <CustomSelect
                                value={docTab}
                                options={[
                                    { value: "planning-inputs", label: "Forecast" },
                                    { value: "planning-goals", label: "Plan" },
                                    {
                                        value: "planning-exchange-rates",
                                        label: "Planning - Cotizaciones",
                                    },
                                    {
                                        value: "planning-config",
                                        label: "Planning - Capital Inicial",
                                    },
                                    { value: "transactions", label: "Transacciones" },
                                    { value: "historical", label: "Datos históricos" },
                                    { value: "networth", label: "Patrimonio" },
                                    { value: "presets", label: "Plantillas" },
                                ]}
                                onChange={(v) => setDocTab(v as ResourceId)}
                            />
                        </div>

                        <div style={{ marginBottom: spacing[4] }}>
                            <div
                                style={{
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.semibold,
                                    color: colors.fg.dim,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: spacing[2],
                                }}
                            >
                                Columnas
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[1] }}>
                                {doc.columns.split(",").map((col, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            padding: `${spacing[0]} ${spacing[2]}`,
                                            borderRadius: radius.sm,
                                            backgroundColor: `${colors.accent.cyan}12`,
                                            color: colors.accent.cyan,
                                            fontSize: fonts.size.xs,
                                            fontFamily: fonts.monoFamily,
                                            fontWeight: fonts.weight.medium,
                                            lineHeight: "24px",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {col}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: spacing[4] }}>
                            <div
                                style={{
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.semibold,
                                    color: colors.fg.dim,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: spacing[2],
                                }}
                            >
                                Ejemplo
                            </div>
                            <div
                                style={{
                                    backgroundColor: colors.bg.base,
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.fill}`,
                                    padding: spacing[3],
                                    overflowX: "auto",
                                }}
                            >
                                <code
                                    style={{
                                        fontSize: fonts.size.xs,
                                        color: colors.fg.dim,
                                        fontFamily: fonts.monoFamily,
                                        whiteSpace: "nowrap",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {doc.example}
                                </code>
                            </div>
                        </div>

                        <div style={{ marginBottom: spacing[5] }}>
                            <div
                                style={{
                                    fontSize: fonts.size.xs,
                                    fontWeight: fonts.weight.semibold,
                                    color: colors.fg.dim,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: spacing[2],
                                }}
                            >
                                Referencia
                            </div>
                            <div
                                style={{
                                    backgroundColor: colors.bg.base,
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.fill}`,
                                    padding: spacing[3],
                                }}
                            >
                                {doc.description}
                            </div>
                        </div>
                    </div>
                </ModalContent>
            </Modal>
        </div>
    );
}
