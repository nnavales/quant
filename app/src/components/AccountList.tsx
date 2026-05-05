import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { accounts, channels } from "@/api_client";
import type { Account, AccountReq, Channel } from "@/api_client/types";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle, rowStyle } from "@/styles/layout";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dropdown } from "./ui/Dropdown";
import { Button } from "@/components/ui/Button";

const inputStyle: React.CSSProperties = {
    height: "28px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    outline: "none",
    boxSizing: "border-box",
};

export function AccountList() {
    const [items, setItems] = useState<Account[]>([]);
    const [channelsList, setChannelsList] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<AccountReq>({ name: "", channel_id: "", instrument: "debit_card" });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<AccountReq>({ name: "", channel_id: "", instrument: "debit_card" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([accounts.list(), channels.list()])
            .then(([accountsData, channelsData]) => {
                setItems(accountsData);
                setChannelsList(channelsData);
            })
            .catch((err: unknown) => toast(getApiErrorMessage(err)))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await accounts.create(formData);
            setFormData({ name: "", channel_id: "", instrument: "debit_card" });
            setShowForm(false);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm(id);
    };

    const startEdit = (account: Account) => {
        setEditingId(account.id);
        setEditData({
            name: account.name,
            channel_id: account.channel_id,
            instrument: account.instrument,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({ name: "", channel_id: "", instrument: "debit_card" });
    };

    const handleUpdate = async (id: string) => {
        try {
            await accounts.update(id, editData);
            setEditingId(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await accounts.delete(deleteConfirm);
            setDeleteConfirm(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    if (loading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    const getChannelName = (channelId: string) => channelsList.find((c) => c.id === channelId)?.name || "-";
    const instrumentLabel = (inst: string) => {
        const map: Record<string, string> = { debit_card: "Débito", credit_card: "Crédito", transfer: "Transferencia", cash: "Efectivo", crypto: "Cripto" };
        return map[inst] || inst;
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[4] }}>
                <Button
                    variant="secondary"
                    iconLeft={<Plus size={16} />}
                    onClick={() => setShowForm(!showForm)}
                >
                    Nueva Cuenta
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: spacing[4], display: "flex", gap: spacing[2], alignItems: "center", flexWrap: "nowrap" }}>
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                    />
                    <div style={{ flex: "0 0 130px", minWidth: 0 }}>
                        <Dropdown
                            options={channelsList.map((c) => ({ id: c.id, label: c.name }))}
                            value={formData.channel_id || ""}
                            onChange={(id) => setFormData({ ...formData, channel_id: id })}
                            placeholder="Canal"
                            triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                        />
                    </div>
                    <div style={{ flex: "0 0 130px", minWidth: 0 }}>
                        <Dropdown
                            options={[
                                { id: "debit_card", label: "Débito" },
                                { id: "credit_card", label: "Crédito" },
                                { id: "transfer", label: "Transferencia" },
                                { id: "cash", label: "Efectivo" },
                            ]}
                            value={formData.instrument || "debit_card"}
                            onChange={(id) => setFormData({ ...formData, instrument: id as any })}
                            placeholder="Instrumento"
                            triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                        <Button type="submit" variant="primary" size="sm">
                            Guardar
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                            Cancelar
                        </Button>
                    </div>
                </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                {items.map((account) =>
                    editingId === account.id ? (
                        <div
                            key={account.id}
                            style={{
                                ...rowStyle,
                                backgroundColor: colors.fill,
                                border: `1px solid ${colors.border}`,
                            }}
                        >
                            <input
                                type="text"
                                value={editData.name || ""}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                style={{ ...inputStyle, flex: "1 1 0", minWidth: 0 }}
                                onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(account.id); if (e.key === "Escape") cancelEdit(); }}
                                autoFocus
                            />
                            <div style={{ flex: "0 0 130px", minWidth: 0 }}>
                                <Dropdown
                                    options={channelsList.map((c) => ({ id: c.id, label: c.name }))}
                                    value={editData.channel_id || ""}
                                    onChange={(id) => setEditData({ ...editData, channel_id: id })}
                                    placeholder="Canal"
                                    triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                />
                            </div>
                            <div style={{ flex: "0 0 130px", minWidth: 0 }}>
                                <Dropdown
                                    options={[
                                        { id: "debit_card", label: "Débito" },
                                        { id: "credit_card", label: "Crédito" },
                                        { id: "transfer", label: "Transferencia" },
                                        { id: "cash", label: "Efectivo" },
                                    ]}
                                    value={editData.instrument || "debit_card"}
                                    onChange={(id) => setEditData({ ...editData, instrument: id as any })}
                                    placeholder="Instrumento"
                                    triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                <Button variant="primary" size="sm" onClick={() => handleUpdate(account.id)}>
                                    <Check size={14} />
                                </Button>
                                <Button variant="secondary" size="sm" onClick={cancelEdit}>
                                    <X size={14} />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div
                            key={account.id}
                            style={rowStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg.base; }}
                        >
                            <div>
                                <div style={{ fontSize: fonts.size.sm, fontWeight: 500, color: colors.fg.base }}>{account.name}</div>
                                <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                    {getChannelName(account.channel_id)} · {instrumentLabel(account.instrument)}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: spacing[1] }}>
                                <Button
                                    variant="icon"
                                    title="Editar"
                                    onClick={() => startEdit(account)}
                                >
                                    <Pencil size={14} />
                                </Button>
                                <Button
                                    variant="icon"
                                    title="Eliminar"
                                    onClick={() => handleDelete(account.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    )
                )}
                {items.length === 0 && <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>No hay cuentas</div>}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description="¿Eliminar esta cuenta?"
            />
        </div>
    );
}
