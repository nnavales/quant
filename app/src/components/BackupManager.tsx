import { useState, useRef } from "react";
import { useExportBackup, useImportBackup } from "@/hooks";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Download, FileUp, HelpCircle, FileText, X } from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle } from "@/styles/layout";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";

const sectionHeaderStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    fontWeight: 600,
    color: colors.fg.dim,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: spacing[3],
};

const resourceOptions = [
    { id: "transactions" as const, label: "Transacciones" },
    { id: "historical" as const, label: "Datos históricos" },
    { id: "networth" as const, label: "Patrimonio" },
];

const csvDocs: Record<string, { columns: string; description: React.ReactNode; example: string }> = {
    historical: {
        columns: "month,income,income_variable,income_fixed,expense,expense_fixed,expense_variable,exchange_rate,savings,source",
        description: (
            <ul style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0, paddingLeft: spacing[4], lineHeight: 1.6 }}>
                <li><strong>month</strong>: formato YYYY-MM (ej: 2025-01)</li>
                <li><strong>income / expense</strong>: totales en USD. Deben ser la suma de sus componentes: <code style={{ color: colors.fg.base }}>income = income_fixed + income_variable</code> y <code style={{ color: colors.fg.base }}>expense = expense_fixed + expense_variable</code></li>
                <li><strong>income_fixed / expense_fixed</strong>: parte fija en USD</li>
                <li><strong>income_variable / expense_variable</strong>: parte variable en USD</li>
                <li><strong>exchange_rate</strong>: tipo de cambio ARS/USD, mayor a 0</li>
                <li><strong>savings</strong>: ahorro neto del mes en USD</li>
                <li><strong>source</strong>: siempre <code style={{ color: colors.fg.base }}>historical</code></li>
            </ul>
        ),
        example: "2025-01,1116,153,964,1316,835,481,1165,-200,historical",
    },
    transactions: {
        columns: "date,description,installment_number,total_installments,group_id,type,frequency,is_done,exchange_rate,amount_ars,amount_usd,currency,category,subcategory,channel,account",
        description: (
            <ul style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0, paddingLeft: spacing[4], lineHeight: 1.6 }}>
                <li><strong>date</strong>: fecha en formato ISO YYYY-MM-DD</li>
                <li><strong>description</strong>: descripción de la transacción</li>
                <li><strong>installment_number / total_installments / group_id</strong>: dejar vacío si no es cuota. Si es cuota: generá un <code style={{ color: colors.fg.base }}>group_id</code> único para agrupar todas las cuotas de ese grupo, poné el número de esta cuota en <code style={{ color: colors.fg.base }}>installment_number</code> y el total de cuotas en <code style={{ color: colors.fg.base }}>total_installments</code></li>
                <li><strong>type</strong>: <code style={{ color: colors.fg.base }}>expense</code> o <code style={{ color: colors.fg.base }}>income</code></li>
                <li><strong>frequency</strong>: <code style={{ color: colors.fg.base }}>variable</code> o <code style={{ color: colors.fg.base }}>fixed</code></li>
                <li><strong>is_done</strong>: <code style={{ color: colors.fg.base }}>true</code> o <code style={{ color: colors.fg.base }}>false</code></li>
                <li><strong>exchange_rate</strong>: tipo de cambio ARS/USD al momento de la transacción</li>
                <li><strong>amount_ars / amount_usd</strong>: montos en ARS y USD</li>
                <li><strong>currency</strong>: <code style={{ color: colors.fg.base }}>ARS</code> o <code style={{ color: colors.fg.base }}>USD</code></li>
                <li><strong>category / subcategory</strong>: nombre de categoría y subcategoría</li>
                <li><strong>channel / account</strong>: nombre del canal y cuenta</li>
            </ul>
        ),
        example: "2025-01-15,Supermercado,,,,expense,variable,true,1200,15000,12.5,ARS,Alimentos,Verduleria,Efectivo,Billetera",
    },
    networth: {
        columns: "name,amount,currency,type",
        description: (
            <ul style={{ color: colors.fg.dim, fontSize: fonts.size.sm, margin: 0, paddingLeft: spacing[4], lineHeight: 1.6 }}>
                <li><strong>name</strong>: nombre del activo o cuenta</li>
                <li><strong>amount</strong>: monto en la moneda indicada</li>
                <li><strong>currency</strong>: <code style={{ color: colors.fg.base }}>ARS</code> o <code style={{ color: colors.fg.base }}>USD</code></li>
                <li><strong>type</strong>: <code style={{ color: colors.fg.base }}>liquid</code> o <code style={{ color: colors.fg.base }}>physical</code></li>
            </ul>
        ),
        example: "Billetera USD,3500,USD,liquid",
    },
};

export function BackupManager() {
    const [selectedResource, setSelectedResource] = useState<"transactions" | "historical" | "networth">("transactions");
    const [showDocs, setShowDocs] = useState(false);
    const [docTab, setDocTab] = useState<"transactions" | "historical" | "networth">("historical");
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
                        filters: [
                            { name: "ZIP", extensions: ["zip"] },
                        ],
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
                    toast(`${resourceOptions.find((r) => r.id === selectedResource)?.label} importado correctamente`, "success");
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
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Exportar datos</h3>
                <p style={{ fontSize: fonts.size.sm, color: colors.fg.dim, marginBottom: spacing[3] }}>
                    Guarda un archivo ZIP con todas tus transacciones, datos históricos y patrimonio.
                </p>
                <Button
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    style={{ display: "flex", alignItems: "center", gap: spacing[2] }}
                >
                    <Download size={16} />
                    {exportMutation.isPending ? "Exportando..." : "Exportar backup"}
                </Button>
            </div>

            <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[3] }}>
                    <h3 style={{ ...sectionHeaderStyle, marginBottom: 0 }}>Importar datos</h3>
                    <button
                        onClick={() => setShowDocs(true)}
                        style={{ background: "none", border: "none", color: colors.fg.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: spacing[1], fontSize: fonts.size.sm, padding: spacing[1], borderRadius: radius.sm }}
                        title="Ver formato CSV"
                    >
                        <HelpCircle size={14} />
                        <span>Formato CSV</span>
                    </button>
                </div>
                <p style={{ fontSize: fonts.size.sm, color: colors.fg.dim, marginBottom: spacing[3] }}>
                    Selecciona el tipo de datos y el archivo CSV para importar.
                </p>

                <div style={{ display: "flex", gap: spacing[2], marginBottom: spacing[3], flexWrap: "wrap" }}>
                    {resourceOptions.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSelectedResource(opt.id)}
                            style={{
                                padding: `${spacing[2]} ${spacing[3]}`,
                                borderRadius: radius.md,
                                border: `1px solid ${selectedResource === opt.id ? colors.border : colors.fill}`,
                                backgroundColor: selectedResource === opt.id ? colors.bg.surface : "transparent",
                                color: selectedResource === opt.id ? colors.fg.base : colors.fg.dim,
                                fontSize: fonts.size.sm,
                                cursor: "pointer",
                                fontFamily: fonts.family.text,
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importMutation.isPending}
                    style={{ display: "flex", alignItems: "center", gap: spacing[2] }}
                >
                    <FileUp size={16} />
                    {importMutation.isPending ? "Importando..." : "Seleccionar archivo CSV"}
                </Button>
            </div>

            <Modal isOpen={showDocs} onClose={() => setShowDocs(false)}>
                <ModalContent
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[6],
                        maxWidth: "560px",
                        width: "100%",
                        border: `1px solid ${colors.fill}`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: spacing[4] }}>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                            <FileText size={18} color={colors.accent.teal} />
                            <h3 style={{ margin: 0, fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>Formato CSV</h3>
                        </div>
                        <button
                            onClick={() => setShowDocs(false)}
                            style={{ background: "none", border: "none", color: colors.fg.dim, cursor: "pointer", padding: spacing[1], display: "flex" }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: spacing[1], marginBottom: spacing[4] }}>
                        {resourceOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setDocTab(opt.id)}
                                style={{
                                    flex: 1,
                                    padding: `${spacing[2]} ${spacing[3]}`,
                                    borderRadius: radius.md,
                                    border: `1px solid ${docTab === opt.id ? colors.border : colors.fill}`,
                                    backgroundColor: docTab === opt.id ? colors.bg.surface : "transparent",
                                    color: docTab === opt.id ? colors.fg.base : colors.fg.dim,
                                    fontSize: fonts.size.sm,
                                    cursor: "pointer",
                                    fontFamily: fonts.family.text,
                                    fontWeight: docTab === opt.id ? 500 : 400,
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ backgroundColor: colors.bg.base, borderRadius: radius.md, padding: spacing[3], border: `1px solid ${colors.fill}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: spacing[2], marginBottom: spacing[2] }}>
                            <span style={{ fontSize: fonts.size.sm, fontWeight: 600, color: colors.fg.base }}>{resourceOptions.find((r) => r.id === docTab)?.label}</span>
                        </div>

                        <div style={{ overflowX: "auto", marginBottom: spacing[3], backgroundColor: colors.bg.surface, borderRadius: radius.sm, border: `1px solid ${colors.fill}` }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <code style={{ display: "block", fontSize: fonts.size.xs, color: colors.accent.cyan, padding: `${spacing[2]} ${spacing[3]}`, fontFamily: "monospace", whiteSpace: "nowrap", wordBreak: "keep-all", borderBottom: `1px solid ${colors.fill}` }}>
                                    {doc.columns}
                                </code>
                                <code style={{ display: "block", fontSize: fonts.size.xs, color: colors.fg.base, padding: `${spacing[2]} ${spacing[3]}`, fontFamily: "monospace", whiteSpace: "nowrap", wordBreak: "keep-all" }}>
                                    {doc.example}
                                </code>
                            </div>
                        </div>

                        {doc.description}
                    </div>
                </ModalContent>
            </Modal>
        </div>
    );
}
