import { useEffect, useState, useRef } from "react";
import { X, ChevronRight, Plus, Check } from "lucide-react";
import { categories, subcategories } from "@/api_client";
import type { Category, Subcategory } from "@/api_client/types";
import { InputGroup } from "./ui/InputGroup";
import { toast } from "./ui/Toast";

interface CategoryGroup {
    category: Category;
    subcategories: Subcategory[];
}

const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--bg-default)",
    border: "1px solid var(--highlight-medium)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--spacing-4)",
};

const chipStyle = (isNew: boolean = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    backgroundColor: isNew ? "transparent" : "var(--highlight-medium)",
    border: isNew ? "1px dashed var(--highlight-high)" : "none",
    borderRadius: "var(--radius-full)",
    fontSize: "var(--font-size-sm)",
    color: isNew ? "var(--fg-muted)" : "var(--fg-default)",
    cursor: isNew ? "pointer" : "default",
    transition: "all 0.15s",
});

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

const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    backgroundColor: "var(--bg-dim)",
    border: "1px solid var(--accent-teal)",
    borderRadius: "var(--radius-md)",
    color: "var(--fg-default)",
    fontSize: "var(--font-size-sm)",
    outline: "none",
};

export function CategoryManager() {
    const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
    const [editingSubcategoryName, setEditingSubcategoryName] = useState("");

    const subcategoryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([categories.listWithSubcategories(), subcategories.list()])
            .then(([catsWithSubs, allSubs]) => {
                const grouped: CategoryGroup[] = catsWithSubs.map((cws) => ({
                    category: cws.category,
                    subcategories: cws.subcategories,
                }));

                const categoriesWithoutSubs = allSubs.filter(
                    (sub) => !catsWithSubs.some((cws) => cws.category.id === sub.category_id)
                );

                if (categoriesWithoutSubs.length > 0) {
                    grouped.push({
                        category: { id: "__uncategorized__", name: "Sin categoría", created_at: "", updated_at: null, deleted_at: null },
                        subcategories: categoriesWithoutSubs,
                    });
                }

                setCategoryGroups(grouped);
            })
            .catch((err: unknown) => toast(err instanceof Error ? err.message : "Error"))
            .finally(() => setLoading(false));
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await categories.create({ name: newCategoryName });
            setNewCategoryName("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleAddSubcategory = async () => {
        if (!newSubcategoryName.trim() || !selectedCategoryId) return;
        try {
            await subcategories.create({ name: newSubcategoryName, category_id: selectedCategoryId });
            setNewSubcategoryName("");
            setSelectedCategoryId(null);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("¿Eliminar categoría y todas sus subcategorías?")) return;
        try {
            await categories.delete(id);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const handleDeleteSubcategory = async (id: string) => {
        try {
            await subcategories.delete(id);
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const startEditCategory = (cat: Category) => {
        setEditingCategoryId(cat.id);
        setEditingCategoryName(cat.name);
    };

    const saveEditCategory = async () => {
        if (!editingCategoryId || !editingCategoryName.trim()) {
            setEditingCategoryId(null);
            return;
        }
        try {
            await categories.update(editingCategoryId, { name: editingCategoryName });
            setEditingCategoryId(null);
            setEditingCategoryName("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    const startEditSubcategory = (sub: Subcategory) => {
        setEditingSubcategoryId(sub.id);
        setEditingSubcategoryName(sub.name);
    };

    const saveEditSubcategory = async () => {
        if (!editingSubcategoryId || !editingSubcategoryName.trim()) {
            setEditingSubcategoryId(null);
            return;
        }
        try {
            await subcategories.update(editingSubcategoryId, { name: editingSubcategoryName });
            setEditingSubcategoryId(null);
            setEditingSubcategoryName("");
            loadData();
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : "Error");
        }
    };

    if (loading) return <div style={{ color: "var(--fg-muted)", textAlign: "center", padding: "var(--spacing-8)" }}>Cargando...</div>;

    return (
        <div>
            <InputGroup
                placeholder="Nueva categoría..."
                value={newCategoryName}
                onChange={setNewCategoryName}
                onSubmit={handleAddCategory}
                buttonLabel="Agregar"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                {categoryGroups.map((group) => (
                    <div
                        key={group.category.id}
                        style={cardStyle}
                        onMouseEnter={() => setHoveredCategoryId(group.category.id)}
                        onMouseLeave={() => setHoveredCategoryId(null)}
                    >
                        {editingCategoryId === group.category.id ? (
                            <div style={{ display: "flex", gap: "var(--spacing-2)", marginBottom: "var(--spacing-2)" }}>
                                <input
                                    type="text"
                                    value={editingCategoryName}
                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") saveEditCategory();
                                        if (e.key === "Escape") setEditingCategoryId(null);
                                    }}
                                    onBlur={saveEditCategory}
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
                                    onDoubleClick={() => startEditCategory(group.category)}
                                >
                                    <ChevronRight size={16} style={{ color: "var(--accent-teal)" }} />
                                    <span style={{ fontWeight: 600, color: "var(--fg-default)" }}>
                                        {group.category.name}
                                    </span>
                                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--fg-muted)" }}>
                                        ({group.subcategories.length})
                                    </span>
                                </div>
                                {group.category.id !== "__uncategorized__" && hoveredCategoryId === group.category.id && (
                                    <button
                                        onClick={() => handleDeleteCategory(group.category.id)}
                                        style={deleteButtonStyle}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                                    >
                                        <X size={14} style={{ color: "var(--semantic-error)" }} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
                            {group.subcategories.map((sub) =>
                                editingSubcategoryId === sub.id ? (
                                    <input
                                        key={sub.id}
                                        type="text"
                                        value={editingSubcategoryName}
                                        onChange={(e) => setEditingSubcategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveEditSubcategory();
                                            if (e.key === "Escape") setEditingSubcategoryId(null);
                                        }}
                                        onBlur={saveEditSubcategory}
                                        autoFocus
                                        style={{ ...inputStyle, width: "120px" }}
                                    />
                                ) : (
                                    <div
                                        key={sub.id}
                                        onDoubleClick={() => startEditSubcategory(sub)}
                                        style={chipStyle(false)}
                                        onMouseEnter={(e) => {
                                            const btn = e.currentTarget.querySelector("button") as HTMLButtonElement;
                                            if (btn) btn.style.opacity = "1";
                                        }}
                                        onMouseLeave={(e) => {
                                            const btn = e.currentTarget.querySelector("button") as HTMLButtonElement;
                                            if (btn) btn.style.opacity = "0";
                                        }}
                                    >
                                        {sub.name}
                                        <button
                                            onClick={() => handleDeleteSubcategory(sub.id)}
                                            style={deleteButtonStyle}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )
                            )}

                            {selectedCategoryId === group.category.id ? (
                                <div style={{ display: "flex", gap: "var(--spacing-1)" }}>
                                    <input
                                        ref={subcategoryInputRef}
                                        type="text"
                                        placeholder="Nombre..."
                                        value={newSubcategoryName}
                                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleAddSubcategory();
                                            if (e.key === "Escape") setSelectedCategoryId(null);
                                        }}
                                        autoFocus
                                        style={{ ...inputStyle, width: "100px" }}
                                    />
                                    <button
                                        onClick={handleAddSubcategory}
                                        style={{
                                            padding: "4px 8px",
                                            backgroundColor: "var(--accent-teal)",
                                            color: "var(--bg-default)",
                                            border: "none",
                                            borderRadius: "var(--radius-sm)",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <Check size={12} />
                                    </button>
                                </div>
                            ) : (
                                group.category.id !== "__uncategorized__" && (
                                    <button
                                        onClick={() => setSelectedCategoryId(group.category.id)}
                                        style={chipStyle(true)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = "var(--highlight-low)";
                                            e.currentTarget.style.borderColor = "var(--fg-muted)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                            e.currentTarget.style.borderColor = "var(--highlight-high)";
                                        }}
                                    >
                                        <Plus size={12} />
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
