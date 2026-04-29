import { useEffect, useState } from "react";
import { Plus, X, RotateCcw, Trash2 } from "lucide-react";
import { categories, subcategories } from "@/api_client";
import type { CategoryWithSubcategories } from "@/api_client/types";
import { toast } from "@/components/ui/Toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle } from "@/styles/layout";
import { ConfirmDialog } from "./ui/ConfirmDialog";
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

export function CategoryList() {
    const [items, setItems] = useState<CategoryWithSubcategories[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "category" | "subcategory" } | null>(null);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{ id: string; type: "category" | "subcategory" } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        categories
            .listWithSubcategories()
            .then(setItems)
            .catch((err: unknown) => toast(getApiErrorMessage(err)))
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
            toast(getApiErrorMessage(err));
        }
    };

    const handleDeleteCategory = (id: string) => {
        setDeleteConfirm({ id, type: "category" });
    };

    const handleDeleteSubcategory = (id: string) => {
        setDeleteConfirm({ id, type: "subcategory" });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            if (deleteConfirm.type === "category") {
                await categories.delete(deleteConfirm.id);
            } else {
                await subcategories.delete(deleteConfirm.id);
            }
            setDeleteConfirm(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await categories.restore(id);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const handleRestoreSubcategory = async (id: string) => {
        try {
            await subcategories.restore(id);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const confirmHardDelete = async () => {
        if (!hardDeleteConfirm) return;
        try {
            if (hardDeleteConfirm.type === "category") {
                await categories.hardDelete(hardDeleteConfirm.id);
            } else {
                await subcategories.hardDelete(hardDeleteConfirm.id);
            }
            setHardDeleteConfirm(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    if (loading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    const activeCategories = items.filter((item) => !item.category.deleted_at);
    const deletedCategories = items.filter((item) => item.category.deleted_at);

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[4] }}>
                <Button
                    variant="secondary"
                    iconLeft={<Plus size={16} />}
                    onClick={() => setShowForm(!showForm)}
                >
                    Nueva Categoría
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: spacing[4], display: "flex", gap: spacing[2] }}>
                    <input
                        type="text"
                        placeholder="Nombre de la categoría"
                        value={formData.name}
                        onChange={(e) => setFormData({ name: e.target.value })}
                        style={inputStyle}
                    />
                    <Button type="submit" variant="primary">
                        Guardar
                    </Button>
                </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {activeCategories.map((item) => {
                    const activeSubs = item.subcategories.filter((s) => !s.deleted_at);
                    const deletedSubs = item.subcategories.filter((s) => s.deleted_at);

                    return (
                        <div
                            key={item.category.id}
                            style={cardStyle}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing[2] }}>
                                <span style={{ fontWeight: 600, fontSize: fonts.size.sm, color: colors.fg.base }}>{item.category.name}</span>
                                <Button
                                    variant="icon"
                                    onClick={() => handleDeleteCategory(item.category.id)}
                                >
                                    <X size={14} />
                                </Button>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[1] }}>
                                {activeSubs.map((sub) => (
                                    <span
                                        key={sub.id}
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            padding: "2px 8px",
                                            backgroundColor: colors.fill,
                                            borderRadius: radius.full,
                                            fontSize: fonts.size.sm,
                                        }}
                                    >
                                        {sub.name}
                                        <Button
                                            variant="icon"
                                            onClick={() => handleDeleteSubcategory(sub.id)}
                                        >
                                            <X size={12} />
                                        </Button>
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
                                            backgroundColor: colors.bg.surface,
                                            border: `1px dashed ${colors.fill}`,
                                            borderRadius: radius.full,
                                            fontSize: fonts.size.sm,
                                            opacity: 0.6,
                                        }}
                                    >
                                        {sub.name}
                                        <Button
                                            variant="icon"
                                            onClick={() => handleRestoreSubcategory(sub.id)}
                                            title="Restaurar"
                                        >
                                            <RotateCcw size={12} />
                                        </Button>
                                        <Button
                                            variant="icon"
                                            onClick={() => setHardDeleteConfirm({ id: sub.id, type: "subcategory" })}
                                            title="Eliminar permanentemente"
                                        >
                                            <Trash2 size={12} style={{ color: colors.accent.red }} />
                                        </Button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {deletedCategories.length > 0 && (
                <div style={{ marginTop: spacing[6] }}>
                    <h4 style={{ color: colors.fg.dim, fontSize: fonts.size.sm, marginBottom: spacing[3], fontWeight: 500 }}>
                        Categorías borradas
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                        {deletedCategories.map((item) => (
                            <div
                                key={item.category.id}
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
                                <span style={{ fontSize: fonts.size.sm }}>{item.category.name}</span>
                                <span style={{ display: "flex", gap: spacing[1] }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        iconLeft={<RotateCcw size={12} />}
                                        onClick={() => handleRestore(item.category.id)}
                                    >
                                        Restaurar
                                    </Button>
                                    <Button
                                        variant="icon"
                                        size="sm"
                                        onClick={() => setHardDeleteConfirm({ id: item.category.id, type: "category" })}
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
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description={deleteConfirm?.type === "category" ? "¿Eliminar esta categoría?" : "¿Eliminar esta subcategoría?"}
            />

            <ConfirmDialog
                isOpen={!!hardDeleteConfirm}
                onClose={() => setHardDeleteConfirm(null)}
                onConfirm={confirmHardDelete}
                title="Eliminar permanentemente"
                description={
                    hardDeleteConfirm?.type === "category"
                        ? "¿Eliminar permanentemente esta categoría y todas sus transacciones asociadas? No se puede deshacer."
                        : "¿Eliminar permanentemente esta subcategoría y todas sus transacciones asociadas? No se puede deshacer."
                }
                confirmLabel="Eliminar permanentemente"
                destructive
                requireHold
            />
        </div>
    );
}
