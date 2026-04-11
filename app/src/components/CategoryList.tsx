import { useEffect, useState } from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import { categories, subcategories } from "@/api_client";
import type { CategoryWithSubcategories } from "@/api_client/types";

export function CategoryList() {
    const [items, setItems] = useState<CategoryWithSubcategories[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        categories
            .listWithSubcategories()
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

    const handleRestore = async (id: string) => {
        try {
            await categories.restore(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDeleteSubcategory = async (id: string) => {
        if (!confirm("¿Eliminar subcategoría?")) return;
        try {
            await subcategories.delete(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleRestoreSubcategory = async (id: string) => {
        try {
            await subcategories.restore(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: "var(--semantic-error)" }}>Error: {error}</div>;

    const activeCategories = items.filter((item) => !item.category.deleted_at);
    const deletedCategories = items.filter((item) => item.category.deleted_at);

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
                        value={formData.name}
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

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                {activeCategories.map((item) => {
                    const activeSubs = item.subcategories.filter((s) => !s.deleted_at);
                    const deletedSubs = item.subcategories.filter((s) => s.deleted_at);

                    return (
                        <div
                            key={item.category.id}
                            style={{
                                padding: "var(--spacing-3) var(--spacing-4)",
                                backgroundColor: "var(--bg-surface)",
                                borderRadius: "var(--radius-md)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-2)" }}>
                                <span style={{ fontWeight: 600 }}>{item.category.name}</span>
                                <button
                                    onClick={() => handleDelete(item.category.id)}
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

                            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-1)" }}>
                                {activeSubs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "2px 8px",
                                            backgroundColor: "var(--highlight-medium)",
                                            borderRadius: "var(--radius-full)",
                                            fontSize: "var(--font-size-sm)",
                                        }}
                                    >
                                        {sub.name}
                                        <button
                                            onClick={() => handleDeleteSubcategory(sub.id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "var(--fg-muted)",
                                                cursor: "pointer",
                                                padding: 0,
                                                display: "flex",
                                            }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                {deletedSubs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "2px 8px",
                                            backgroundColor: "var(--bg-dim)",
                                            border: "1px dashed var(--fg-muted)",
                                            borderRadius: "var(--radius-full)",
                                            fontSize: "var(--font-size-sm)",
                                            opacity: 0.6,
                                        }}
                                    >
                                        {sub.name}
                                        <button
                                            onClick={() => handleRestoreSubcategory(sub.id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "var(--fg-muted)",
                                                cursor: "pointer",
                                                padding: 0,
                                                display: "flex",
                                            }}
                                        >
                                            <RotateCcw size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {deletedCategories.length > 0 && (
                <div style={{ marginTop: "var(--spacing-6)" }}>
                    <h4 style={{ color: "var(--fg-muted)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-3)" }}>
                        Categorías borradas
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
                        {deletedCategories.map((item) => (
                            <div
                                key={item.category.id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "var(--spacing-3) var(--spacing-4)",
                                    backgroundColor: "var(--bg-dim)",
                                    border: "1px dashed var(--fg-muted)",
                                    borderRadius: "var(--radius-md)",
                                    opacity: 0.6,
                                }}
                            >
                                <span>{item.category.name}</span>
                                <button
                                    onClick={() => handleRestore(item.category.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--spacing-1)",
                                        padding: "var(--spacing-1) var(--spacing-2)",
                                        backgroundColor: "transparent",
                                        color: "var(--fg-muted)",
                                        border: "none",
                                        borderRadius: "var(--radius-sm)",
                                        cursor: "pointer",
                                        fontSize: "var(--font-size-xs)",
                                    }}
                                >
                                    <RotateCcw size={12} />
                                    Restaurar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
