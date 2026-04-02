import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { categories } from "@/api_client";
import type { Category, CategoryReq } from "@/api_client/types";

export function CategoryList() {
    const [items, setItems] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<CategoryReq>({ name: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        categories
            .list()
            .then(setItems)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await categories.create(formData);
            setFormData({ name: "" });
            setShowForm(false);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar categoría?")) return;
        try {
            await categories.delete(id);
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
                    Nueva Categoría
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
                        placeholder="Nombre de la categoría"
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
                {items.map((category) => (
                    <div
                        key={category.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "var(--spacing-3) var(--spacing-4)",
                            backgroundColor: "var(--bg-surface)",
                            borderRadius: "var(--radius-md)",
                        }}
                    >
                        <span>{category.name}</span>
                        <button
                            onClick={() => handleDelete(category.id)}
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
                {items.length === 0 && <div style={{ color: "var(--fg-muted)" }}>No hay categorías</div>}
            </div>
        </div>
    );
}
