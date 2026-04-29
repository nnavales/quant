import { useState } from "react";
import { useNetWorth, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks";
import { spacing, radius, shadows } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { CustomSelect } from "@/components/ui/Select";
import { Plus, X, Wallet, Droplets, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Currency, AssetType, NetWorth } from "@/api_client/types";

/* ──────────── AddAssetForm ──────────── */

interface AddAssetFormProps {
    onClose: () => void;
}

function AddAssetForm({ onClose }: AddAssetFormProps) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState<Currency>("USD");
    const [type, setType] = useState<AssetType>("liquid");
    const createAsset = useCreateAsset();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !amount.trim()) return;

        createAsset.mutate(
            { name: name.trim(), amount: amount.trim(), currency, type },
            {
                onSuccess: () => {
                    toast("Activo creado", "success");
                    onClose();
                },
                onError: (err) => {
                    toast(getApiErrorMessage(err));
                },
            }
        );
    };

    return (
        <Modal isOpen onClose={onClose}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.lg,
                    padding: spacing[4],
                    width: "90%",
                    maxWidth: "400px",
                    border: `1px solid ${colors.fill}`,
                    boxShadow: shadows.xl,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: spacing[4],
                    }}
                >
                    <h2 style={{ fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base }}>
                        Nuevo Activo
                    </h2>
                    <Button
                        variant="plain"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                    <div>
                        <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, display: "block", marginBottom: spacing[1] }}>Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Cuenta banco"
                            style={{
                                width: "100%",
                                padding: spacing[2],
                                backgroundColor: colors.bg.base,
                                border: `1px solid ${colors.fill}`,
                                borderRadius: radius.md,
                                color: colors.fg.base,
                                fontSize: fonts.size.sm,
                                outline: "none",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, display: "block", marginBottom: spacing[1] }}>Monto</label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="1000"
                            style={{
                                width: "100%",
                                padding: spacing[2],
                                backgroundColor: colors.bg.base,
                                border: `1px solid ${colors.fill}`,
                                borderRadius: radius.md,
                                color: colors.fg.base,
                                fontSize: fonts.size.sm,
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: spacing[3] }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, display: "block", marginBottom: spacing[1] }}>Moneda</label>
                            <CustomSelect
                                value={currency}
                                options={[{ value: "USD", label: "USD" }, { value: "ARS", label: "ARS" }]}
                                onChange={(v) => setCurrency(v as Currency)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: fonts.size.xs, color: colors.fg.dim, display: "block", marginBottom: spacing[1] }}>Tipo</label>
                            <CustomSelect
                                value={type}
                                options={[{ value: "liquid", label: "Líquido" }, { value: "physical", label: "Físico" }]}
                                onChange={(v) => setType(v as AssetType)}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        color="cyan"
                        disabled={createAsset.isPending || !name.trim() || !amount.trim()}
                        loading={createAsset.isPending}
                    >
                        Agregar Activo
                    </Button>
                </form>
            </ModalContent>
        </Modal>
    );
}

/* ──────────── AssetRow ──────────── */

interface AssetRowProps {
    asset: { id: string; name: string; amount: string; currency: Currency; type: AssetType };
}

type EditingField = "name" | "amount" | null;

function AssetRow({ asset }: AssetRowProps) {
    const [editingField, setEditingField] = useState<EditingField>(null);
    const [editValue, setEditValue] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const updateAsset = useUpdateAsset();
    const deleteAsset = useDeleteAsset();

    const startEdit = (field: EditingField) => {
        setEditingField(field);
        if (field === "name") setEditValue(asset.name);
        else if (field === "amount") setEditValue(asset.amount);
    };

    const saveEdit = () => {
        if (!editingField) return;

        let originalValue: string;
        if (editingField === "name") originalValue = asset.name;
        else if (editingField === "amount") originalValue = asset.amount;
        else return;

        if (editValue === originalValue) {
            setEditingField(null);
            return;
        }

        const fieldMap: Record<Exclude<EditingField, null>, string> = {
            name: "name",
            amount: "amount",
        };
        updateAsset.mutate(
            { id: asset.id, data: { [fieldMap[editingField]]: editValue } },
            {
                onSuccess: () => toast("Activo actualizado", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
        setEditingField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") setEditingField(null);
    };

    const handleDelete = () => {
        deleteAsset.mutate(asset.id, {
            onSuccess: () => {
                toast("Activo eliminado", "success");
                setDeleteConfirm(false);
            },
            onError: (err) => toast(getApiErrorMessage(err)),
        });
    };

    const formatAmount = (amount: string) => {
        const num = parseFloat(amount);
        return new Intl.NumberFormat("es-AR", {
            style: "decimal",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(num);
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: "transparent",
        border: "none",
        color: colors.fg.base,
        fontSize: fonts.table.body,
        outline: "none",
        padding: "1px 2px",
        width: "100%",
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: `${spacing[1]} ${spacing[2]}`,
                borderRadius: radius.md,
                cursor: "pointer",
                transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.bg.base)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2], flex: 1, minWidth: 0 }}>
                <span
                    onClick={() => {
                        const newType = asset.type === "liquid" ? "physical" : "liquid";
                        updateAsset.mutate(
                            { id: asset.id, data: { type: newType } },
                            {
                                onSuccess: () => toast("Tipo actualizado", "success"),
                                onError: (err) => toast(getApiErrorMessage(err)),
                            }
                        );
                    }}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                    {asset.type === "liquid" ? (
                        <Droplets size={14} color={colors.accent.cyan} opacity={0.8} />
                    ) : (
                        <Package size={14} color={colors.accent.purple} opacity={0.8} />
                    )}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 1, minWidth: 0 }}>
                    {editingField === "name" ? (
                        <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                    ) : (
                        <span
                            onClick={() => startEdit("name")}
                            style={{ color: colors.fg.base, fontSize: fonts.table.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {asset.name}
                        </span>
                    )}
                    <span
                        onClick={() => {
                            const newType = asset.type === "liquid" ? "physical" : "liquid";
                            updateAsset.mutate(
                                { id: asset.id, data: { type: newType } },
                                {
                                    onSuccess: () => toast("Tipo actualizado", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
                                }
                            );
                        }}
                        style={{
                            backgroundColor: colors.bg.surface,
                            color: asset.type === "liquid" ? colors.accent.cyan : colors.accent.purple,
                            fontSize: fonts.table.badge,
                            padding: "1px 4px",
                            borderRadius: radius.sm,
                            flexShrink: 0,
                            cursor: "pointer",
                            transition: "color 0.15s",
                        }}
                    >
                        {asset.type === "liquid" ? "Líq." : "Fís."}
                    </span>
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                {editingField === "amount" ? (
                    <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        style={{
                            ...inputStyle,
                            fontFamily: fonts.family.display,
                            textAlign: "right",
                            width: "70px",
                        }}
                    />
                ) : (
                    <span
                        onClick={() => startEdit("amount")}
                        style={{ fontFamily: fonts.family.display, color: colors.fg.dim, fontSize: fonts.table.amount, textAlign: "right" }}
                    >
                        {formatAmount(asset.amount)}
                    </span>
                )}
                <span
                    onClick={() => {
                        const newCurrency = asset.currency === "USD" ? "ARS" : "USD";
                        updateAsset.mutate(
                            { id: asset.id, data: { currency: newCurrency } },
                            {
                                onSuccess: () => toast("Moneda actualizada", "success"),
                                onError: (err) => toast(getApiErrorMessage(err)),
                            }
                        );
                    }}
                    style={{
                        backgroundColor: colors.bg.surface,
                        color: colors.fg.dim,
                        fontSize: fonts.table.badge,
                        padding: "1px 4px",
                        borderRadius: radius.sm,
                        flexShrink: 0,
                        cursor: "pointer",
                    }}
                >
                    {asset.currency}
                </span>
                <Button
                    variant="icon"
                    title="Eliminar"
                    onClick={() => setDeleteConfirm(true)}
                >
                    <Trash2 size={12} />
                </Button>
            </div>

            <ConfirmDialog
                isOpen={deleteConfirm}
                onClose={() => setDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Confirmar eliminación"
                description={`¿Eliminar activo "${asset.name}"?`}
                isLoading={deleteAsset.isPending}
            />
        </div>
    );
}

/* ──────────── NetWorthWidget ──────────── */

function NetWorthWidget({ networthData }: { networthData: NetWorth }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const formatUSD = (value: string) => {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(parseFloat(value));
    };

    const total = parseFloat(networthData.total_usd);
    const liquid = parseFloat(networthData.liquid_usd);
    const physical = parseFloat(networthData.physical_usd);
    const liquidPct = total > 0 ? (liquid / total) * 100 : 0;
    const physicalPct = total > 0 ? (physical / total) * 100 : 0;

    const liquidColor = colors.accent.cyan;
    const physicalColor = colors.accent.purple;

    return (
        <div
            style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.lg,
                padding: spacing[4],
                border: `1px solid ${colors.fill}`,
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                    <Wallet size={18} color={colors.accent.cyan} />
                    <span style={{ fontSize: fonts.size.sm, color: colors.fg.base, textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Net Worth</span>
                </div>
                <Button
                    variant="chip"
                    color="cyan"
                    size="sm"
                    iconLeft={<Plus size={14} />}
                    onClick={() => setShowAddForm(true)}
                >
                    Agregar
                </Button>
            </div>

            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[1], letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Total Assets
                </div>
                <div style={{ fontSize: fonts.size["2xl"], fontWeight: 700, fontFamily: fonts.family.display, color: colors.fg.base, letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {formatUSD(networthData.total_usd)}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[2] }}>
                <div
                    style={{
                        backgroundColor: "rgba(34, 211, 238, 0.06)",
                        borderRadius: radius.md,
                        padding: spacing[3],
                        border: `1px solid rgba(34, 211, 238, 0.12)`,
                        display: "flex",
                        flexDirection: "column",
                        gap: spacing[1],
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[1] }}>
                        <Droplets size={14} color={liquidColor} />
                        <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>Líquido</span>
                        <span style={{ marginLeft: "auto", fontSize: fonts.size.xs, color: liquidColor, fontWeight: 600 }}>
                            {liquidPct.toFixed(0)}%
                        </span>
                    </div>
                    <div style={{ fontFamily: fonts.family.display, fontSize: fonts.size.lg, color: colors.fg.base, fontWeight: 600, lineHeight: 1.2 }}>
                        {formatUSD(networthData.liquid_usd)}
                    </div>
                </div>
                <div
                    style={{
                        backgroundColor: "rgba(192, 132, 252, 0.06)",
                        borderRadius: radius.md,
                        padding: spacing[3],
                        border: `1px solid rgba(192, 132, 252, 0.12)`,
                        display: "flex",
                        flexDirection: "column",
                        gap: spacing[1],
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[1] }}>
                        <Package size={14} color={physicalColor} />
                        <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>Físico</span>
                        <span style={{ marginLeft: "auto", fontSize: fonts.size.xs, color: physicalColor, fontWeight: 600 }}>
                            {physicalPct.toFixed(0)}%
                        </span>
                    </div>
                    <div style={{ fontFamily: fonts.family.display, fontSize: fonts.size.lg, color: colors.fg.base, fontWeight: 600, lineHeight: 1.2 }}>
                        {formatUSD(networthData.physical_usd)}
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", height: 6, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.bg.base }}>
                <div style={{ width: `${liquidPct}%`, backgroundColor: liquidColor, transition: "width 0.5s ease" }} />
                <div style={{ width: `${physicalPct}%`, backgroundColor: physicalColor, transition: "width 0.5s ease" }} />
            </div>

            {networthData.assets && networthData.assets.length > 0 && (
                <div style={{ borderTop: `1px solid ${colors.fill}`, paddingTop: spacing[3], display: "flex", flexDirection: "column", gap: spacing[2] }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: fonts.size.xs, fontWeight: 600, color: colors.fg.base }}>Activos ({networthData.assets.length})</span>
                        <span
                            style={{
                                fontSize: fonts.table.badge,
                                color: colors.fg.dim,
                                backgroundColor: colors.bg.surface,
                                padding: "1px 6px",
                                borderRadius: radius.sm,
                                border: `1px solid ${colors.fill}`,
                            }}
                        >
                            Presiona para editar
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[1], maxHeight: "244px", overflowY: "auto", paddingRight: spacing[1], paddingBottom: spacing[1], boxSizing: "border-box" }}>
                        {networthData.assets.map((asset) => (
                            <AssetRow key={asset.id} asset={asset} />
                        ))}
                    </div>
                </div>
            )}

            {showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}
        </div>
    );
}

/* ──────────── NetWorthWidgetContainer ──────────── */

export function NetWorthWidgetContainer() {
    const { data, isLoading, isError } = useNetWorth();

    if (isLoading) {
        return (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[4], border: `1px solid ${colors.fill}` }}>
                <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>Cargando Net Worth...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[4], border: `1px solid ${colors.fill}` }}>
                <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[4] }}>Error al cargar Net Worth</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[4], border: `1px solid ${colors.fill}` }}>
                <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>Sin datos</div>
            </div>
        );
    }

    return <NetWorthWidget networthData={data} />;
}
