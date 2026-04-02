import { useEffect, useState } from "react";
import { X, Check, ChevronRight, CreditCard, Wallet, Plus } from "lucide-react";
import { channels, accounts } from "@/api_client";
import type { Channel, Account, Instrument } from "@/api_client/types";
import { InputGroup } from "./ui/InputGroup";
import { toast } from "./ui/Toast";

interface ChannelGroup {
    channel: Channel;
    accounts: Account[];
}

const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-default)",
    border: "1px solid var(--highlight-medium)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--spacing-4)",
};

const instrumentLabels: Record<Instrument, string> = {
    credit_card: "Crédito",
    debit_card: "Débito",
    transfer: "Transferencia",
    cash: "Efectivo",
    crypto: "Cripto",
};

const instrumentIcons: Record<Instrument, React.ElementType> = {
    credit_card: CreditCard,
    debit_card: CreditCard,
    transfer: Wallet,
    cash: Wallet,
    crypto: Wallet,
};

const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    backgroundColor: "var(--bg-dim)",
    border: "1px solid var(--highlight-medium)",
    borderRadius: "var(--radius-md)",
    color: "var(--fg-default)",
    fontSize: "var(--font-size-sm)",
    outline: "none",
};

const deleteButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "none",
    color: "var(--fg-muted)",
    cursor: "pointer",
    padding: "2px",
    display: "flex",
    borderRadius: "var(--radius-full)",
    opacity: 0,
    transition: "all 0.15s",
};

export function ChannelAccountManager() {
    const [channelGroups, setChannelGroups] = useState<ChannelGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const [newChannelName, setNewChannelName] = useState("");
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountInstrument, setNewAccountInstrument] = useState<Instrument>("debit_card");
    const [newAccountLastFour, setNewAccountLastFour] = useState("");
    const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

    const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
    const [editingChannelName, setEditingChannelName] = useState("");
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [editingAccountName, setEditingAccountName] = useState("");
    const [editingAccountInstrument, setEditingAccountInstrument] = useState<Instrument>("debit_card");
    const [editingAccountLastFour, setEditingAccountLastFour] = useState("");

    const [showAccountForm, setShowAccountForm] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([channels.listWithAccounts(), accounts.list()])
            .then(([chansWithAccs, allAccs]) => {
                const grouped: ChannelGroup[] = chansWithAccs.map((cwa) => ({
                    channel: cwa.channel,
                    accounts: cwa.accounts || [],
                }));

                const accountsWithoutChannel = allAccs.filter(
                    (acc) => !chansWithAccs.some((cwa) => cwa.channel?.id === acc.channel_id)
                );

                if (accountsWithoutChannel.length > 0) {
                    grouped.push({
                        channel: { id: "__uncategorized__", name: "Sin canal", created_at: "", updated_at: null, deleted_at: null },
                        accounts: accountsWithoutChannel,
                    });
                }

                setChannelGroups(grouped);
            })
            .catch((err: unknown) => toast(err instanceof Error ? err.message : "Error"))
            .finally(() => setLoading(false));
    };

    const handleAddChannel = async () => {
        if (!newChannelName.trim()) return;
        try {
            await channels.create({ name: newChannelName });
            setNewChannelName("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleAddAccount = async (channelId: string) => {
        if (!newAccountName.trim()) return;
        try {
            await accounts.create({
                name: newAccountName,
                channel_id: channelId,
                instrument: newAccountInstrument,
                last_four: newAccountLastFour || undefined,
            });
            setNewAccountName("");
            setNewAccountInstrument("debit_card");
            setNewAccountLastFour("");
            setShowAccountForm(null);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDeleteChannel = async (id: string) => {
        if (!confirm("¿Eliminar canal y todas sus cuentas?")) return;
        try {
            await channels.delete(id);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDeleteAccount = async (id: string) => {
        try {
            await accounts.delete(id);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const startEditChannel = (channel: Channel) => {
        setEditingChannelId(channel.id);
        setEditingChannelName(channel.name);
    };

    const saveEditChannel = async () => {
        if (!editingChannelId || !editingChannelName.trim()) {
            setEditingChannelId(null);
            return;
        }
        try {
            await channels.update(editingChannelId, { name: editingChannelName });
            setEditingChannelId(null);
            setEditingChannelName("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const startEditAccount = (acc: Account) => {
        setEditingAccountId(acc.id);
        setEditingAccountName(acc.name);
        setEditingAccountInstrument(acc.instrument);
        setEditingAccountLastFour(acc.last_four || "");
    };

    const saveEditAccount = async () => {
        if (!editingAccountId || !editingAccountName.trim()) {
            setEditingAccountId(null);
            return;
        }
        try {
            await accounts.update(editingAccountId, {
                name: editingAccountName,
                instrument: editingAccountInstrument,
                last_four: editingAccountLastFour || undefined,
            });
            setEditingAccountId(null);
            setEditingAccountName("");
            setEditingAccountInstrument("debit_card");
            setEditingAccountLastFour("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div style={{ color: "var(--fg-muted)", textAlign: "center", padding: "var(--spacing-8)" }}>Cargando...</div>;

    return (
        <div>
            <InputGroup
                placeholder="Nuevo canal..."
                value={newChannelName}
                onChange={setNewChannelName}
                onSubmit={handleAddChannel}
                buttonLabel="Agregar"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                {channelGroups.map((group) => (
                    <div
                        key={group.channel.id}
                        style={cardStyle}
                        onMouseEnter={() => setHoveredChannelId(group.channel.id)}
                        onMouseLeave={() => setHoveredChannelId(null)}
                    >
                        {editingChannelId === group.channel.id ? (
                            <div style={{ display: "flex", gap: "var(--spacing-2)", marginBottom: "var(--spacing-3)" }}>
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
                                    style={{ ...inputStyle, flex: 1, borderColor: "var(--accent-teal)" }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "var(--spacing-3)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--spacing-2)",
                                        cursor: "pointer",
                                    }}
                                    onDoubleClick={() => startEditChannel(group.channel)}
                                >
                                    <ChevronRight size={16} style={{ color: "var(--accent-purple)" }} />
                                    <span style={{ fontWeight: 600, color: "var(--fg-default)" }}>
                                        {group.channel.name}
                                    </span>
                                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                        ({group.accounts.length})
                                    </span>
                                </div>
                                {group.channel.id !== "__uncategorized__" && hoveredChannelId === group.channel.id && (
                                    <button
                                        onClick={() => handleDeleteChannel(group.channel.id)}
                                        style={deleteButtonStyle}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                                    >
                                        <X size={14} style={{ color: "var(--semantic-error)" }} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                            {group.accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "var(--spacing-2) var(--spacing-3)",
                                        backgroundColor: "var(--highlight-low)",
                                        borderRadius: "var(--radius-md)",
                                    }}
                                >
                                    {editingAccountId === acc.id ? (
                                        <div style={{ display: "flex", gap: "var(--spacing-2)", flex: 1, flexWrap: "wrap" }}>
                                            <input
                                                type="text"
                                                value={editingAccountName}
                                                onChange={(e) => setEditingAccountName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") saveEditAccount();
                                                    if (e.key === "Escape") setEditingAccountId(null);
                                                }}
                                                onBlur={saveEditAccount}
                                                autoFocus
                                                placeholder="Nombre"
                                                style={{ ...inputStyle, width: "120px" }}
                                            />
                                            <select
                                                value={editingAccountInstrument}
                                                onChange={(e) => setEditingAccountInstrument(e.target.value as Instrument)}
                                                style={{ ...inputStyle, width: "110px" }}
                                            >
                                                <option value="debit_card">Débito</option>
                                                <option value="credit_card">Crédito</option>
                                                <option value="transfer">Transferencia</option>
                                                <option value="cash">Efectivo</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={editingAccountLastFour}
                                                onChange={(e) => setEditingAccountLastFour(e.target.value)}
                                                placeholder="****"
                                                maxLength={4}
                                                style={{ ...inputStyle, width: "60px" }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", cursor: "pointer" }}
                                                onDoubleClick={() => startEditAccount(acc)}
                                            >
                                                {(() => {
                                                    const Icon = instrumentIcons[acc.instrument];
                                                    return <Icon size={14} style={{ color: "var(--fg-muted)" }} />;
                                                })()}
                                                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--fg-default)" }}>
                                                    {acc.name}
                                                </span>
                                                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                                    {instrumentLabels[acc.instrument]}
                                                </span>
                                                {acc.last_four && (
                                                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                                        **** {acc.last_four}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAccount(acc.id)}
                                                style={{ ...deleteButtonStyle, opacity: 0.5 }}
                                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
                                            >
                                                <X size={12} style={{ color: "var(--semantic-error)" }} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}

                            {showAccountForm === group.channel.id ? (
                                <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap", padding: "var(--spacing-2)", backgroundColor: "var(--bg-dim)", borderRadius: "var(--radius-md)" }}>
                                    <input
                                        type="text"
                                        placeholder="Nombre cuenta..."
                                        value={newAccountName}
                                        onChange={(e) => setNewAccountName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddAccount(group.channel.id)}
                                        style={{ ...inputStyle, width: "120px" }}
                                        autoFocus
                                    />
                                    <select
                                        value={newAccountInstrument}
                                        onChange={(e) => setNewAccountInstrument(e.target.value as Instrument)}
                                        style={{ ...inputStyle, width: "110px" }}
                                    >
                                        <option value="debit_card">Débito</option>
                                        <option value="credit_card">Crédito</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="cash">Efectivo</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="****"
                                        value={newAccountLastFour}
                                        onChange={(e) => setNewAccountLastFour(e.target.value)}
                                        maxLength={4}
                                        style={{ ...inputStyle, width: "60px" }}
                                    />
                                    <button
                                        onClick={() => handleAddAccount(group.channel.id)}
                                        style={{
                                            padding: "6px 10px",
                                            backgroundColor: "var(--accent-teal)",
                                            color: "var(--bg-default)",
                                            border: "none",
                                            borderRadius: "var(--radius-md)",
                                            cursor: "pointer",
                                            fontSize: "var(--font-size-xs)",
                                        }}
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowAccountForm(null)}
                                        style={{
                                            padding: "6px 10px",
                                            backgroundColor: "transparent",
                                            color: "var(--fg-muted)",
                                            border: "1px solid var(--highlight-medium)",
                                            borderRadius: "var(--radius-md)",
                                            cursor: "pointer",
                                            fontSize: "var(--font-size-xs)",
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                group.channel.id !== "__uncategorized__" && (
                                    <button
                                        onClick={() => setShowAccountForm(group.channel.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--spacing-1)",
                                            padding: "6px 10px",
                                            backgroundColor: "transparent",
                                            border: "1px dashed var(--highlight-high)",
                                            borderRadius: "var(--radius-md)",
                                            fontSize: "var(--font-size-xs)",
                                            color: "var(--fg-muted)",
                                            cursor: "pointer",
                                            width: "fit-content",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = "var(--fg-muted)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = "var(--highlight-high)";
                                        }}
                                    >
                                        <Plus size={12} />
                                        Agregar cuenta
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
