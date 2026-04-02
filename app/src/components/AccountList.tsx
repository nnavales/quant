import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { accounts, channels } from "@/api_client";
import type { Account, AccountReq, Channel } from "@/api_client/types";

export function AccountList() {
    const [items, setItems] = useState<Account[]>([]);
    const [channelsList, setChannelsList] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<AccountReq>({ name: "", channel_id: "", instrument: "debit_card" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([accounts.list(), channels.list()])
            .then(([accountsData, channelsData]) => {
                setItems(accountsData);
                setChannelsList(channelsData);
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
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
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar cuenta?")) return;
        try {
            await accounts.delete(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: "var(--semantic-error)" }}>Error: {error}</div>;

    const getChannelName = (channelId: string) => channelsList.find((c) => c.id === channelId)?.name || "-";

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--spacing-4)" }}>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-2)",
                        padding: "var(--spacing-2) var(--spacing-3)",
                        backgroundColor: "var(--accent-teal)",
                        color: "var(--bg-default)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    <Plus size={16} />
                    Nueva Cuenta
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        gap: "var(--spacing-2)",
                        marginBottom: "var(--spacing-4)",
                        padding: "var(--spacing-4)",
                        backgroundColor: "var(--bg-surface)",
                        borderRadius: "var(--radius-lg)",
                        flexWrap: "wrap",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                            flex: 1,
                            minWidth: "150px",
                            padding: "var(--spacing-2) var(--spacing-3)",
                            backgroundColor: "var(--bg-default)",
                            border: "1px solid var(--highlight-medium)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--fg-default)",
                        }}
                    />
                    <select
                        value={formData.channel_id || ""}
                        onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            backgroundColor: "var(--bg-default)",
                            border: "1px solid var(--highlight-medium)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--fg-default)",
                        }}
                    >
                        <option value="">Seleccionar canal</option>
                        {channelsList.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={formData.instrument || "debit_card"}
                        onChange={(e) => setFormData({ ...formData, instrument: e.target.value as any })}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            backgroundColor: "var(--bg-default)",
                            border: "1px solid var(--highlight-medium)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--fg-default)",
                        }}
                    >
                        <option value="debit_card">Débito</option>
                        <option value="credit_card">Crédito</option>
                        <option value="transfer">Transferencia</option>
                        <option value="cash">Efectivo</option>
                    </select>
                    <button
                        type="submit"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-4)",
                            backgroundColor: "var(--accent-teal)",
                            color: "var(--bg-default)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                        }}
                    >
                        Guardar
                    </button>
                </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                {items.map((account) => (
                    <div
                        key={account.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "var(--spacing-3) var(--spacing-4)",
                            backgroundColor: "var(--bg-surface)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 500 }}>{account.name}</div>
                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                {getChannelName(account.channel_id)} • {account.instrument}
                                {account.last_four && ` • ****${account.last_four}`}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(account.id)}
                            style={{
                                padding: "var(--spacing-1) var(--spacing-2)",
                                backgroundColor: "transparent",
                                color: "var(--semantic-error)",
                                border: "1px solid var(--semantic-error)",
                                borderRadius: "var(--radius-sm)",
                                cursor: "pointer",
                                fontSize: "var(--font-size-xs)",
                            }}
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
                {items.length === 0 && <div style={{ color: "var(--fg-muted)" }}>No hay cuentas</div>}
            </div>
        </div>
    );
}
