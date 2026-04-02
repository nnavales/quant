import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { subcategories, categories } from "@/api_client";
import type { Subcategory, SubcategoryReq, Category } from "@/api_client/types";

export function SubcategoryList() {
    const [items, setItems] = useState<Subcategory[]>([]);
    const [categoriesList, setCategoriesList] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<SubcategoryReq>({ name: "", category_id: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([subcategories.list(), categories.list()])
            .then(([subcategoriesData, categoriesData]) => {
                setItems(subcategoriesData);
                setCategoriesList(categoriesData);
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await subcategories.create(formData);
            setFormData({ name: "", category_id: "" });
            setShowForm(false);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar subcategoría?")) return;
        try {
            await subcategories.delete(id);
            loadData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div style={{ color: "var(--semantic-error)" }}>Error: {error}</div>;

    const getCategoryName = (categoryId: string) => categoriesList.find((c) => c.id === categoryId)?.name || "-";

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
                    Nueva Subcategoría
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
                        value={formData.category_id || ""}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-3)",
                            backgroundColor: "var(--bg-default)",
                            border: "1px solid var(--highlight-medium)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--fg-default)",
                        }}
                    >
                        <option value="">Seleccionar categoría</option>
                        {categoriesList.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
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
                {items.map((subcategory) => (
                    <div
                        key={subcategory.id}
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
                            <div style={{ fontWeight: 500 }}>{subcategory.name}</div>
                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                {getCategoryName(subcategory.category_id)}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(subcategory.id)}
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
                {items.length === 0 && <div style={{ color: "var(--fg-muted)" }}>No hay subcategorías</div>}
            </div>
        </div>
    );
}
