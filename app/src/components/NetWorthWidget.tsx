import { useState, useMemo } from "react";
import { useNetWorth, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks";
import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Dropdown } from "@/components/ui/Dropdown";
import { Plus, X, Droplets, Package, Trash2, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Currency, AssetType, NetWorth } from "@/api_client/types";

const labelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    fontWeight: 500,
    marginBottom: spacing[2],
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: colors.bg.base,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    width: "100%",
    height: "40px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.15s",
};

/* ──────────── AddAssetForm ──────────── */

interface AddAssetFormProps {
    onClose: () => void;
}

export function AddAssetForm({ onClose }: AddAssetFormProps) {
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
        <Modal isOpen onClose={onClose} opacity={0.8}>
            <ModalContent
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.xl,
                    padding: spacing[5],
                    width: "92%",
                    maxWidth: "500px",
                    maxHeight: "80vh",
                    overflow: "auto",
                    border: `1px solid ${colors.border}`,
                    outline: `1px solid ${colors.border}`,
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
                    <h2 style={{ fontSize: fonts.size.lg, fontWeight: 600, color: colors.fg.base, margin: 0 }}>
                        Nuevo Activo
                    </h2>
                    <Button variant="plain" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                    <div>
                        <label style={labelStyle}>Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Cuenta banco"
                            style={inputStyle}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Monto</label>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="1000"
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[3] }}>
                        <div>
                            <label style={labelStyle}>Moneda</label>
                            <Dropdown
                                options={[
                                    { id: "USD", label: "USD" },
                                    { id: "ARS", label: "ARS" },
                                ]}
                                value={currency}
                                onChange={(v) => setCurrency(v as Currency)}
                                triggerStyle={{ height: "40px" }}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Tipo</label>
                            <Dropdown
                                options={[
                                    { id: "liquid", label: "Líquido" },
                                    { id: "physical", label: "Físico" },
                                ]}
                                value={type}
                                onChange={(v) => setType(v as AssetType)}
                                triggerStyle={{ height: "40px" }}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        disabled={createAsset.isPending || !name.trim() || !amount.trim()}
                        loading={createAsset.isPending}
                        fullWidth
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

    const inEdit: React.CSSProperties = {
        backgroundColor: "transparent",
        border: "none",
        color: colors.fg.base,
        fontSize: fonts.size.base,
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
                padding: `${spacing[2]} ${spacing[2]}`,
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
                        <Droplets size={15} color={colors.accent.cyan} opacity={0.8} />
                    ) : (
                        <Package size={15} color={colors.accent.purple} opacity={0.8} />
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
                            style={{ ...inEdit, flex: 1 }}
                        />
                    ) : (
                        <span
                            onDoubleClick={() => startEdit("name")}
                            style={{ color: colors.fg.base, fontSize: fonts.size.base, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {asset.name}
                        </span>
                    )}
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
                            ...inEdit,
                            fontFamily: fonts.family.display,
                            textAlign: "right",
                            width: "70px",
                        }}
                    />
                ) : (
                    <span
                        onDoubleClick={() => startEdit("amount")}
                        style={{ fontFamily: fonts.family.display, color: colors.fg.dim, fontSize: fonts.size.base, textAlign: "right" }}
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
                        fontSize: fonts.size.sm,
                        padding: `${spacing[1]} ${spacing[2]}`,
                        borderRadius: radius.md,
                        textTransform: "uppercase",
                        fontWeight: 500,
                        backgroundColor: colors.fill,
                        color: asset.currency === "ARS" ? colors.accent.cyan : colors.accent.green,
                        lineHeight: 1,
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >
                    {asset.currency}
                </span>
                <Button
                    variant="icon"
                    title="Eliminar"
                    onClick={() => setDeleteConfirm(true)}
                >
                    <Trash2 size={14} />
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

function NetWorthWidget({ networthData, hideFrame = false }: { networthData: NetWorth; hideFrame?: boolean }) {
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

    const assets = networthData.assets || [];

    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "liquid" | "physical">("all");
    const [sortAsc, setSortAsc] = useState(true);

    const filteredAssets = useMemo(() => {
        let list = assets;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((a) => a.name.toLowerCase().includes(q));
        }
        if (typeFilter !== "all") {
            list = list.filter((a) => a.type === typeFilter);
        }
        return list.sort((a, b) => {
            return a.name.localeCompare(b.name) * (sortAsc ? 1 : -1);
        });
    }, [assets, searchQuery, sortAsc, typeFilter]);

    return (
        <div
            style={{
                backgroundColor: hideFrame ? undefined : colors.bg.surface,
                borderRadius: hideFrame ? undefined : radius.lg,
                padding: spacing[4],
                border: hideFrame ? undefined : `1px solid ${colors.border}`,
                display: "flex",
                flexDirection: "column",
                gap: spacing[4],
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            {!hideFrame && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: spacing[3], borderBottom: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: fonts.size.sm, color: colors.fg.base, textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Net Worth</span>
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
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                <div style={{ fontFamily: fonts.family.display, fontSize: fonts.size["2xl"], color: colors.fg.base, fontWeight: 700, lineHeight: 1.1 }}>
                    {formatUSD(networthData.total_usd)}
                </div>
                <div>
                    <div style={{ display: "flex", height: 6, borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.bg.base }}>
                        <div style={{ width: `${liquidPct}%`, backgroundColor: liquidColor, transition: "width 0.5s ease" }} />
                        <div style={{ width: `${physicalPct}%`, backgroundColor: physicalColor, transition: "width 0.5s ease" }} />
                    </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing[2] }}>
                    <div
                        style={{
                            backgroundColor: colors.widget.cyanBg,
                            borderRadius: radius.md,
                            padding: spacing[2],
                            border: `1px solid ${colors.widget.cyanBorder}`,
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[1],
                        }}
                    >
                        <Droplets size={15} color={liquidColor} />
                        <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim, flexShrink: 0 }}>Líquido</span>
                        <span style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {formatUSD(networthData.liquid_usd)}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: fonts.size.xs, color: liquidColor, fontWeight: 600, flexShrink: 0 }}>
                            {liquidPct.toFixed(0)}%
                        </span>
                    </div>
                    <div
                        style={{
                            backgroundColor: colors.widget.purpleBg,
                            borderRadius: radius.md,
                            padding: spacing[2],
                            border: `1px solid ${colors.widget.purpleBorder}`,
                            display: "flex",
                            alignItems: "center",
                            gap: spacing[1],
                        }}
                    >
                        <Package size={15} color={physicalColor} />
                        <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim, flexShrink: 0 }}>Físico</span>
                        <span style={{ fontFamily: fonts.family.display, fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {formatUSD(networthData.physical_usd)}
                        </span>
                        <span style={{ marginLeft: "auto", fontSize: fonts.size.xs, color: physicalColor, fontWeight: 600, flexShrink: 0 }}>
                            {physicalPct.toFixed(0)}%
                        </span>
                    </div>
                </div>
            </div>

            {(hideFrame || (!hideFrame && assets.length > 0)) && (
                <div style={{ borderTop: `1px solid ${colors.fill}`, paddingTop: spacing[3], flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: spacing[5] }}>
                    <div style={{ display: "flex", alignItems: "center", gap: spacing[2], flexShrink: 0 }}>
                        <span style={{ fontSize: fonts.size.sm, fontWeight: 600, color: colors.fg.base }}>
                            Activos ({assets.length})
                        </span>
                        {assets.length > 0 && (
                            <>
                                <div style={{ display: "flex", alignItems: "center", gap: spacing[1], flexShrink: 0 }}>
                                    {(["all", "liquid", "physical"] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTypeFilter(t)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                fontSize: fonts.size.sm,
                                                color: typeFilter === t ? (t === "liquid" ? colors.accent.cyan : t === "physical" ? colors.accent.purple : colors.fg.base) : colors.fg.dim,
                                                fontWeight: typeFilter === t ? 600 : 400,
                                                padding: `${spacing[1]} ${spacing[3]}`,
                                                borderRadius: radius.md,
                                                backgroundColor: typeFilter === t ? (t === "liquid" ? colors.variant.cyan.bg : t === "physical" ? `${colors.accent.purple}18` : colors.fill) : "transparent",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {t === "all" ? "Todo" : t === "liquid" ? "Líquido" : "Físico"}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setSortAsc((a) => !a)}
                                    style={{ display: "flex", alignItems: "center", gap: spacing[1], background: "none", border: "none", cursor: "pointer", fontSize: fonts.size.sm, color: colors.fg.base, fontWeight: 600, padding: `${spacing[1]} ${spacing[3]}`, borderRadius: radius.md, backgroundColor: colors.fill, transition: "all 0.15s" }}
                                >
                                    <ArrowUpDown size={13} />
                                    {sortAsc ? "A-Z" : "Z-A"}
                                </button>
                                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: spacing[1], backgroundColor: colors.bg.surface, borderRadius: radius.md, padding: `0 ${spacing[2]}`, border: `1px solid ${colors.border}`, maxWidth: "160px" }}>
                                    <Search size={14} color={colors.fg.dim} />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar..."
                                        style={{ background: "none", border: "none", outline: "none", color: colors.fg.base, fontSize: fonts.size.sm, width: "100%", padding: `${spacing[1]} 0`, fontFamily: fonts.family.text }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {filteredAssets.length > 0 ? (
                        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: spacing[1], paddingRight: spacing[1], boxSizing: "border-box", maxHeight: hideFrame ? "360px" : "244px" }}>
                            {filteredAssets.map((asset) => (
                                <AssetRow key={asset.id} asset={asset} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ color: colors.fg.dim, fontSize: fonts.size.sm }}>
                                {searchQuery ? "Sin resultados" : "Sin activos registrados"}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {!hideFrame && showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}
        </div>
    );
}

/* ──────────── NetWorthWidgetContainer ──────────── */

export function NetWorthWidgetContainer({ hideFrame = false }: { hideFrame?: boolean }) {
    const { data, isLoading, isError } = useNetWorth();
    const [showAddForm, setShowAddForm] = useState(false);

    if (isLoading) {
        if (hideFrame) {
            return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>Cargando Net Worth...</div>;
        }
        return (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[4], border: `1px solid ${colors.border}`, height: "100%", minHeight: "420px", boxSizing: "border-box" }}>
                <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>Cargando Net Worth...</div>
            </div>
        );
    }

    if (isError) {
        if (hideFrame) {
            return <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[4] }}>Error al cargar Net Worth</div>;
        }
        return (
            <div style={{ backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing[4], border: `1px solid ${colors.border}`, height: "100%", minHeight: "420px", boxSizing: "border-box" }}>
                <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[4] }}>Error al cargar Net Worth</div>
            </div>
        );
    }

    if (!data) {
        if (hideFrame) {
            return (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: colors.fg.dim, fontSize: fonts.size.sm }}>Sin activos registrados</span>
                </div>
            );
        }
        return (
            <>
                <div
                    style={{
                        backgroundColor: colors.bg.surface,
                        borderRadius: radius.lg,
                        padding: spacing[4],
                        border: `1px solid ${colors.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: spacing[4],
                        height: "100%",
                        minHeight: "420px",
                        boxSizing: "border-box",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: spacing[3], borderBottom: `1px solid ${colors.border}` }}>
                        <span style={{ fontSize: fonts.size.sm, color: colors.fg.base, textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Net Worth</span>
                        <Button variant="chip" color="cyan" size="sm" iconLeft={<Plus size={14} />} onClick={() => setShowAddForm(true)}>
                            Agregar
                        </Button>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: colors.fg.dim, fontSize: fonts.size.sm }}>Sin activos registrados</span>
                    </div>
                </div>
                {showAddForm && <AddAssetForm onClose={() => setShowAddForm(false)} />}
            </>
        );
    }

    return <NetWorthWidget networthData={data} hideFrame={hideFrame} />;
}
