import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { subcategories, categories } from "@/api_client";
import type { Subcategory, SubcategoryReq, Category } from "@/api_client/types";
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
    flex: 1,
};

export function SubcategoryList() {
    const [items, setItems] = useState<Subcategory[]>([]);
    const [categoriesList, setCategoriesList] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<SubcategoryReq>({ name: "", category_id: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        Promise.all([subcategories.list(), categories.list()])
            .then(([subcategoriesData, categoriesData]) => {
                setItems(subcategoriesData);
                setCategoriesList(categoriesData);
            })
            .catch((err: unknown) => toast(getApiErrorMessage(err)))
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
            toast(getApiErrorMessage(err));
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await subcategories.delete(deleteConfirm);
            setDeleteConfirm(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    if (loading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    const getCategoryName = (categoryId: string) => categoriesList.find((c) => c.id === categoryId)?.name || "-";

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[4] }}>
                <Button
                    variant="secondary"
                    iconLeft={<Plus size={16} />}
                    onClick={() => setShowForm(!showForm)}
                >
                    Nueva Subcategoría
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: spacing[4], display: "flex", gap: spacing[2], flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder="Nombre"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{ ...inputStyle, minWidth: "150px" }}
                    />
                    <Dropdown
                        options={categoriesList.map((c) => ({ id: c.id, label: c.name }))}
                        value={formData.category_id || ""}
                        onChange={(id) => setFormData({ ...formData, category_id: id })}
                        placeholder="Categoría"
                        triggerStyle={{ height: "28px", fontSize: fonts.size.sm }}
                    />
                    <Button type="submit" variant="primary">
                        Guardar
                    </Button>
                </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                {items.map((subcategory) => (
                    <div
                        key={subcategory.id}
                        style={rowStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg.base; }}
                    >
                        <div>
                            <div style={{ fontSize: fonts.size.sm, fontWeight: 500, color: colors.fg.base }}>{subcategory.name}</div>
                            <div style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>{getCategoryName(subcategory.category_id)}</div>
                        </div>
                        <Button
                            variant="icon"
                            title="Eliminar"
                            onClick={() => handleDelete(subcategory.id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                ))}
                {items.length === 0 && <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>No hay subcategorías</div>}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description="¿Eliminar esta subcategoría?"
            />
        </div>
    );
}
