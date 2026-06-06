import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { accounts, channels } from "@/api_client";
import type { Account, Channel } from "@/api_client/types";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { rowStyle, inputStyle, flexColumn } from "@/styles/layout";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Dropdown } from "./ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { SettingsCard } from "@/components/SettingsCard";

export function AccountList() {
    const [items, setItems] = useState<Account[]>([]);
    const [channelsList, setChannelsList] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<{ name: string; channel_id: string }>({ name: "", channel_id: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<{ name: string; channel_id: string }>({ name: "", channel_id: "" });

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
            await accounts.create({ ...formData, instrument: "transfer" });
            setFormData({ name: "", channel_id: "" });
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
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({ name: "", channel_id: "" });
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

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[4] }}>
                <Button
                    variant="secondary"
                    iconLeft={<Plus size={16} strokeWidth={2.5} />}
                    onClick={() => setShowForm(!showForm)}
                >
                    Nueva Cuenta
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ marginBottom: spacing[4] }}>
                    <SettingsCard style={{ display: "flex", gap: spacing[2], alignItems: "center", flexWrap: "nowrap" }}>
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
                    </SettingsCard>
                </form>
            )}

            <div style={{ ...flexColumn, gap: spacing[2] }}>
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
                                />
                            </div>
                            <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                <Button variant="primary" size="sm" onClick={() => handleUpdate(account.id)}>
                                    <Check size={14} strokeWidth={2.5} />
                                </Button>
                                <Button variant="secondary" size="sm" onClick={cancelEdit}>
                                    <X size={14} strokeWidth={2.5} />
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
                                <div style={{ fontSize: fonts.size.sm, fontWeight: fonts.weight.medium, color: colors.fg.base }}>{account.name}</div>
                                <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                    {getChannelName(account.channel_id)}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: spacing[1] }}>
                                <Button
                                    variant="icon"
                                    title="Editar"
                                    onClick={() => startEdit(account)}
                                >
                                    <Pencil size={14} strokeWidth={2.5} />
                                </Button>
                                <Button
                                    variant="icon"
                                    title="Eliminar"
                                    onClick={() => handleDelete(account.id)}
                                >
                                    <Trash2 size={14} strokeWidth={2.5} />
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
