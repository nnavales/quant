import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { channels } from "@/api_client";
import type { Channel, ChannelReq } from "@/api_client/types";

export function ChannelList() {
    const [items, setItems] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<ChannelReq>({ name: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        channels
            .list()
            .then(setItems)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await channels.create(formData);
            setFormData({ name: "" });
            setShowForm(false);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar canal?")) return;
        try {
            await channels.delete(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: "var(--semantic-error)" }}>Error: {error}</div>;

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
                    Nuevo Canal
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
                    }}
                >
                    <input
                        type="text"
                        placeholder="Nombre del canal"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ name: e.target.value })}
                        style={{
                            flex: 1,
                            padding: "var(--spacing-2) var(--spacing-3)",
                            backgroundColor: "var(--bg-default)",
                            border: "1px solid var(--highlight-medium)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--fg-default)",
                        }}
                    />
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
                {items.map((channel) => (
                    <div
                        key={channel.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "var(--spacing-3) var(--spacing-4)",
                            backgroundColor: "var(--bg-surface)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        <span>{channel.name}</span>
                        <button
                            onClick={() => handleDelete(channel.id)}
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
                {items.length === 0 && <div style={{ color: "var(--fg-muted)" }}>No hay canales</div>}
            </div>
        </div>
    );
}
