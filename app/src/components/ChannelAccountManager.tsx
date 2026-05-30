import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, ChevronRight, Plus, RotateCcw, Pencil, Trash2 } from "lucide-react";
import type { Channel, Account } from "@/api_client/types";
import {
    useGroupedChannels,
    useChannelsWithAccounts,
    useAccounts,
    useCreateChannel,
    useDeleteChannel,
    useRestoreChannel,
    useUpdateChannel,
    useCreateAccount,
    useDeleteAccount,
    useRestoreAccount,
    useUpdateAccount,
    useHardDeleteChannel,
    useHardDeleteAccount,
} from "@/hooks";
import { InputGroup } from "./ui/InputGroup";
import { Button } from "@/components/ui/Button";
import { toast } from "@/utils/toast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle, rowStyle, inputStyle, flexBetween, flexColumn, flexRow, truncate } from "@/styles/layout";
import { SettingsCard } from "@/components/SettingsCard";

export function ChannelAccountManager() {
    const queryClient = useQueryClient();

    const { data: chansWithAccs, isLoading } = useChannelsWithAccounts();
    const { data: allAccs } = useAccounts();
    const channelGroups = useGroupedChannels(chansWithAccs, allAccs ?? []);

    const createChannelMutation = useCreateChannel();
    const deleteChannelMutation = useDeleteChannel();
    const restoreChannelMutation = useRestoreChannel();
    const updateChannelMutation = useUpdateChannel();
    const createAccountMutation = useCreateAccount();
    const deleteAccountMutation = useDeleteAccount();
    const restoreAccountMutation = useRestoreAccount();
    const updateAccountMutation = useUpdateAccount();
    const hardDeleteChannelMutation = useHardDeleteChannel();
    const hardDeleteAccountMutation = useHardDeleteAccount();

    const [newChannelName, setNewChannelName] = useState("");
    const [newAccountName, setNewAccountName] = useState("");

    const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
    const [editingChannelName, setEditingChannelName] = useState("");
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [editingAccountName, setEditingAccountName] = useState("");

    const [showAccountForm, setShowAccountForm] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "channel" | "account" } | null>(null);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{ id: string; type: "channel" | "account" } | null>(null);
    const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

    const toggleExpandChannel = (id: string) => {
        setExpandedChannels((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    function refetch() {
        queryClient.invalidateQueries({ queryKey: ["channels", "with-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
    }

    const handleAddChannel = () => {
        const name = newChannelName.trim();
        if (!name) return;
        const exists = channelGroups.some((g) => g.channel.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`El canal "${name}" ya existe`);
            return;
        }
        createChannelMutation.mutate(
            { name },
            {
                onSuccess: () => {
                    setNewChannelName("");
                    refetch();
                    toast("Canal creado", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleAddAccount = (channelId: string) => {
        const name = newAccountName.trim();
        if (!name) return;
        const group = channelGroups.find((g) => g.channel.id === channelId);
        const exists = group?.accounts.some((a) => a.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`La cuenta "${name}" ya existe en este canal`);
            return;
        }
        createAccountMutation.mutate(
            {
                name,
                channel_id: channelId,
                instrument: "transfer",
            },
            {
                onSuccess: () => {
                    setNewAccountName("");
                    setShowAccountForm(null);
                    refetch();
                    toast("Cuenta creada", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleDeleteChannel = (id: string) => {
        setDeleteConfirm({ id, type: "channel" });
    };

    const confirmDeleteChannel = () => {
        if (!deleteConfirm) return;
        deleteChannelMutation.mutate(deleteConfirm.id, {
            onSuccess: () => {
                setDeleteConfirm(null);
                refetch();
                toast("Canal eliminado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleDeleteAccount = (id: string) => {
        setDeleteConfirm({ id, type: "account" });
    };

    const confirmDeleteAccount = () => {
        if (!deleteConfirm) return;
        deleteAccountMutation.mutate(deleteConfirm.id, {
            onSuccess: () => {
                setDeleteConfirm(null);
                refetch();
                toast("Cuenta eliminada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleRestoreChannel = (id: string) => {
        restoreChannelMutation.mutate(id, {
            onSuccess: () => {
                refetch();
                toast("Canal restaurado", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleRestoreAccount = (id: string) => {
        restoreAccountMutation.mutate(id, {
            onSuccess: () => {
                refetch();
                toast("Cuenta restaurada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleHardDeleteChannel = () => {
        if (!hardDeleteConfirm) return;
        hardDeleteChannelMutation.mutate(hardDeleteConfirm.id, {
            onSuccess: () => {
                refetch();
                toast("Canal eliminado permanentemente", "success");
                setHardDeleteConfirm(null);
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleHardDeleteAccount = () => {
        if (!hardDeleteConfirm) return;
        hardDeleteAccountMutation.mutate(hardDeleteConfirm.id, {
            onSuccess: () => {
                refetch();
                toast("Cuenta eliminada permanentemente", "success");
                setHardDeleteConfirm(null);
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const startEditChannel = (channel: Channel) => {
        setEditingChannelId(channel.id);
        setEditingChannelName(channel.name);
    };

    const saveEditChannel = () => {
        const name = editingChannelName.trim();
        if (!editingChannelId || !name) {
            setEditingChannelId(null);
            return;
        }
        const originalChan = channelGroups.find((g) => g.channel.id === editingChannelId)?.channel;
        if (originalChan && originalChan.name === name) {
            setEditingChannelId(null);
            setEditingChannelName("");
            return;
        }
        const exists = channelGroups.some(
            (g) => g.channel.id !== editingChannelId && g.channel.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            toast(`El canal "${name}" ya existe`);
            return;
        }
        updateChannelMutation.mutate(
            { id: editingChannelId, data: { name } },
            {
                onSuccess: () => {
                    setEditingChannelId(null);
                    setEditingChannelName("");
                    refetch();
                    toast("Canal actualizado", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const startEditAccount = (acc: Account) => {
        setEditingAccountId(acc.id);
        setEditingAccountName(acc.name);
    };

    const saveEditAccount = () => {
        const name = editingAccountName.trim();
        if (!editingAccountId || !name) {
            setEditingAccountId(null);
            return;
        }
        const allAccs = channelGroups.flatMap((g) => g.accounts);
        const originalAcc = allAccs.find((a) => a.id === editingAccountId);
        if (originalAcc && originalAcc.name === name) {
            setEditingAccountId(null);
            setEditingAccountName("");
            return;
        }
        const parentGroup = channelGroups.find((g) => g.accounts.some((a) => a.id === editingAccountId));
        const exists = parentGroup?.accounts.some(
            (a) => a.id !== editingAccountId && a.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            toast(`La cuenta "${name}" ya existe en este canal`);
            return;
        }
        updateAccountMutation.mutate(
            {
                id: editingAccountId,
                data: {
                    name,
                },
            },
            {
                onSuccess: () => {
                    setEditingAccountId(null);
                    setEditingAccountName("");
                    toast("Cuenta actualizada", "success");
                    refetch();
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    if (isLoading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    const activeGroups = channelGroups.filter((g) => !g.channel.deleted_at);
    const deletedGroups = channelGroups.filter((g) => g.channel.deleted_at);

    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            <SettingsCard>
                <InputGroup
                    placeholder="Nuevo canal..."
                    value={newChannelName}
                    onChange={setNewChannelName}
                    onSubmit={handleAddChannel}
                    buttonLabel="Agregar"
                />
            </SettingsCard>

            <div style={{ ...flexColumn, gap: spacing[3] }}>
                {activeGroups.map((group) => (
                    <div
                        key={group.channel.id}
                        style={{ ...cardStyle, backgroundColor: colors.bg.elevated }}
                    >
                        {editingChannelId === group.channel.id ? (
                            <div style={{ ...flexBetween, gap: spacing[5] }}>
                                <div style={{ ...flexRow, gap: spacing[2], flex: 1, minWidth: 0 }}>
                                    <ChevronRight
                                        size={16}
                                        style={{ color: colors.fg.dim, flexShrink: 0, transition: "transform 0.15s", transform: expandedChannels.has(group.channel.id) ? "rotate(90deg)" : "rotate(0deg)", cursor: "pointer" }}
                                        onClick={() => toggleExpandChannel(group.channel.id)}
                                    />
                                    <div style={{ display: "flex", gap: spacing[2], alignItems: "center", flex: 1, padding: spacing[1], backgroundColor: colors.bg.surface, borderRadius: radius.md, overflow: "hidden", height: "32px" }}>
                                        <input
                                            type="text"
                                            value={editingChannelName}
                                            onChange={(e) => setEditingChannelName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEditChannel();
                                                if (e.key === "Escape") setEditingChannelId(null);
                                            }}
                                            onBlur={saveEditChannel}
                                            autoFocus
                                            style={{ ...inputStyle, flex: 1, border: "none", minWidth: 0 }}
                                        />
                                        {group.channel.id !== "__uncategorized__" && (
                                            <span style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                                <Button variant="icon" onClick={saveEditChannel}>
                                                    <Check size={14} />
                                                </Button>
                                                <Button variant="icon" onClick={() => setEditingChannelId(null)}>
                                                    <X size={14} />
                                                </Button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    ...flexBetween,
                                    gap: spacing[5],
                                }}
                            >
                                <div
                                    style={{
                                        ...flexRow,
                                        gap: spacing[2],
                                        cursor: "pointer",
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                    onClick={() => toggleExpandChannel(group.channel.id)}
                                >
                                    <ChevronRight
                                        size={16}
                                        style={{
                                            color: colors.fg.dim,
                                            flexShrink: 0,
                                            transition: "transform 0.15s",
                                            transform: expandedChannels.has(group.channel.id) ? "rotate(90deg)" : "rotate(0deg)",
                                        }}
                                    />
                                    <span style={{...truncate, fontWeight: fonts.weight.semibold,
                                        color: colors.fg.base,
                                        fontSize: fonts.size.sm,
                                        flex: 1,
                                        minWidth: 0,
                                        paddingRight: spacing[2]}}>
                                        {group.channel.name}
                                    </span>
                                </div>
                                {group.channel.id !== "__uncategorized__" && (
                                    <span style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                        <Button variant="icon" onClick={() => startEditChannel(group.channel)} title="Editar">
                                            <Pencil size={14} />
                                        </Button>
                                        <Button variant="icon" onClick={() => handleDeleteChannel(group.channel.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </span>
                                )}
                            </div>
                        )}

                        {expandedChannels.has(group.channel.id) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: spacing[1], marginTop: spacing[3], paddingLeft: spacing[6], borderLeft: `1px solid ${colors.fill}` }}>
                                {group.accounts.filter(a => !a.deleted_at).map((acc) => (
                                    <div key={acc.id}>
                                        {editingAccountId === acc.id ? (
                                            <div style={{ display: "flex", gap: spacing[2], alignItems: "center", padding: spacing[1], backgroundColor: colors.bg.surface, borderRadius: radius.md, overflow: "hidden", height: "32px" }}>
                                                <input
                                                    type="text"
                                                    value={editingAccountName}
                                                    onChange={(e) => setEditingAccountName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") saveEditAccount();
                                                        if (e.key === "Escape") setEditingAccountId(null);
                                                    }}
                                                    autoFocus
                                                    placeholder="Nombre"
                                                    style={{ ...inputStyle, flex: 1, minWidth: 0, border: "none" }}
                                                />
                                                <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                                    <Button variant="icon" onClick={saveEditAccount}>
                                                        <Check size={14} />
                                                    </Button>
                                                    <Button variant="icon" onClick={() => setEditingAccountId(null)}>
                                                        <X size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ ...rowStyle, paddingRight: 0, gap: spacing[5] }}>
                                                <div style={{ ...flexRow, gap: spacing[2], flex: 1, minWidth: 0, overflow: "hidden" }}>
                                                    <span style={{...truncate, fontSize: fonts.size.sm, color: colors.fg.base}}>
                                                        {acc.name}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                                    <Button variant="icon" title="Editar" onClick={() => startEditAccount(acc)}>
                                                        <Pencil size={12} />
                                                    </Button>
                                                    <Button variant="icon" title="Eliminar" onClick={() => handleDeleteAccount(acc.id)}>
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {group.accounts.filter(a => a.deleted_at).map((acc) => (
                                    <div key={acc.id} style={{ ...rowStyle, opacity: 0.6, backgroundColor: colors.bg.surface, paddingRight: 0, gap: spacing[5] }}>
                                        <div style={{ ...flexRow, gap: spacing[2], flex: 1, minWidth: 0, overflow: "hidden" }}>
                                            <span style={{...truncate, fontSize: fonts.size.sm, color: colors.fg.dim}}>
                                                {acc.name}
                                            </span>
                                        </div>
                                        <span style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                            <Button variant="icon" onClick={() => handleRestoreAccount(acc.id)} title="Restaurar">
                                                <RotateCcw size={12} />
                                            </Button>
                                            <Button variant="icon" onClick={() => setHardDeleteConfirm({ id: acc.id, type: "account" })} title="Eliminar permanentemente">
                                                <Trash2 size={12} style={{ color: colors.accent.red }} />
                                            </Button>
                                        </span>
                                    </div>
                                ))}

                                {showAccountForm === group.channel.id ? (
                                    <div style={{ display: "flex", gap: spacing[2], alignItems: "center", padding: spacing[1], backgroundColor: colors.bg.surface, borderRadius: radius.md, overflow: "hidden", height: "32px" }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre cuenta..."
                                            value={newAccountName}
                                            onChange={(e) => setNewAccountName(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddAccount(group.channel.id)}
                                            style={{ ...inputStyle, flex: 1, minWidth: 0, border: "none" }}
                                            autoFocus
                                        />
                                        <div style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}>
                                            <Button variant="icon" onClick={() => handleAddAccount(group.channel.id)}>
                                                <Check size={14} />
                                            </Button>
                                            <Button variant="icon" onClick={() => setShowAccountForm(null)}>
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    group.channel.id !== "__uncategorized__" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAccountForm(group.channel.id)}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = colors.fg.base; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = colors.fg.dim; }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: spacing[1],
                                                padding: `${spacing[1]} ${spacing[2]}`,
                                                fontSize: fonts.size.sm,
                                                backgroundColor: "transparent",
                                                border: "none",
                                                color: colors.fg.dim,
                                                cursor: "pointer",
                                                fontWeight: fonts.weight.medium,
                                                fontFamily: fonts.family,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Plus size={14} />
                                            Agregar cuenta
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {deletedGroups.length > 0 && (
                <div style={{ marginTop: spacing[6] }}>
                    <h4 style={{ color: colors.fg.dim, fontSize: fonts.size.sm, marginBottom: spacing[3], fontWeight: fonts.weight.medium }}>
                        Canales borrados
                    </h4>
                    <div style={{ ...flexColumn, gap: spacing[2] }}>
                        {deletedGroups.map((group) => (
                            <div
                                key={group.channel.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: `${spacing[3]} ${spacing[4]}`,
                                    backgroundColor: colors.bg.surface,
                                    border: `1px dashed ${colors.fill}`,
                                    borderRadius: radius.md,
                                    opacity: 0.6,
                                }}
                            >
                                <span style={{ fontSize: fonts.size.sm }}>{group.channel.name}</span>
                                <span style={{ display: "flex", gap: 0 }}>
                                    <Button
                                        variant="icon"
                                        onClick={() => handleRestoreChannel(group.channel.id)}
                                        title="Restaurar"
                                    >
                                        <RotateCcw size={14} />
                                    </Button>
                                    <Button
                                        variant="icon"
                                        onClick={() => setHardDeleteConfirm({ id: group.channel.id, type: "channel" })}
                                        title="Eliminar permanentemente"
                                    >
                                        <Trash2 size={14} style={{ color: colors.accent.red }} />
                                    </Button>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={deleteConfirm?.type === "channel" ? confirmDeleteChannel : confirmDeleteAccount}
                title="Confirmar eliminación"
                description={deleteConfirm?.type === "channel" ? "¿Eliminar canal y todas sus cuentas?" : "¿Eliminar cuenta?"}
                isLoading={deleteChannelMutation.isPending || deleteAccountMutation.isPending}
            />

            <ConfirmDialog
                isOpen={!!hardDeleteConfirm}
                onClose={() => setHardDeleteConfirm(null)}
                onConfirm={hardDeleteConfirm?.type === "channel" ? handleHardDeleteChannel : handleHardDeleteAccount}
                title="Eliminar permanentemente"
                description={
                    hardDeleteConfirm?.type === "channel"
                        ? "¿Eliminar permanentemente este canal y todas sus transacciones asociadas? No se puede deshacer."
                        : "¿Eliminar permanentemente esta cuenta y todas sus transacciones asociadas? No se puede deshacer."
                }
                confirmLabel="Eliminar permanentemente"
                isLoading={hardDeleteChannelMutation.isPending || hardDeleteAccountMutation.isPending}
                destructive
                requireHold
            />
        </div>
    );
}
