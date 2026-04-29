import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, ChevronRight, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Category, Subcategory } from "@/api_client/types";
import {
    useGroupedCategories,
    useCategoriesWithSubcategories,
    useSubcategories,
    useCreateCategory,
    useDeleteCategory,
    useRestoreCategory,
    useUpdateCategory,
    useCreateSubcategory,
    useDeleteSubcategory,
    useRestoreSubcategory,
    useUpdateSubcategory,
    useHardDeleteCategory,
    useHardDeleteSubcategory,
} from "@/hooks";
import { InputGroup } from "./ui/InputGroup";
import { toast } from "./ui/Toast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle } from "@/styles/layout";

const chipStyle = (isNew: boolean = false): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[3]}`,
    backgroundColor: isNew ? "transparent" : colors.bg.base,
    border: "none",
    borderRadius: radius.md,
    fontSize: fonts.size.sm,
    color: isNew ? colors.fg.dim : colors.fg.base,
    cursor: isNew ? "pointer" : "default",
    height: "26px",
    boxSizing: "border-box",
});

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
};

const subcategoryInputStyle: React.CSSProperties = {
    height: "26px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    outline: "none",
    boxSizing: "border-box",
};

export function CategoryManager() {
    const queryClient = useQueryClient();

    const { data: catsWithSubs, isLoading } = useCategoriesWithSubcategories();
    const { data: allSubs } = useSubcategories();
    const categoryGroups = useGroupedCategories(catsWithSubs, allSubs ?? []);

    const createCategoryMutation = useCreateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const restoreCategoryMutation = useRestoreCategory();
    const updateCategoryMutation = useUpdateCategory();
    const createSubcategoryMutation = useCreateSubcategory();
    const deleteSubcategoryMutation = useDeleteSubcategory();
    const restoreSubcategoryMutation = useRestoreSubcategory();
    const updateSubcategoryMutation = useUpdateSubcategory();
    const hardDeleteCategoryMutation = useHardDeleteCategory();
    const hardDeleteSubcategoryMutation = useHardDeleteSubcategory();

    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubcategoryName, setNewSubcategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
    const [editingSubcategoryName, setEditingSubcategoryName] = useState("");

    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "category" | "subcategory" } | null>(null);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{ id: string; type: "category" | "subcategory" } | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleExpandCategory = (id: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    function refetch() {
        queryClient.invalidateQueries({ queryKey: ["categories", "with-subcategories"] });
        queryClient.invalidateQueries({ queryKey: ["subcategories"] });
    }

    const handleAddCategory = () => {
        const name = newCategoryName.trim();
        if (!name) return;
        const exists = categoryGroups.some((g) => g.category.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`La categoría "${name}" ya existe`);
            return;
        }
        createCategoryMutation.mutate(
            { name },
            {
                onSuccess: () => {
                    setNewCategoryName("");
                    refetch();
                    toast("Categoría creada", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleAddSubcategory = () => {
        const name = newSubcategoryName.trim();
        if (!name || !selectedCategoryId) return;
        const group = categoryGroups.find((g) => g.category.id === selectedCategoryId);
        const exists = group?.subcategories.some((s) => s.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            toast(`La subcategoría "${name}" ya existe`);
            return;
        }
        createSubcategoryMutation.mutate(
            { name, category_id: selectedCategoryId },
            {
                onSuccess: () => {
                    setNewSubcategoryName("");
                    setSelectedCategoryId(null);
                    refetch();
                    toast("Subcategoría creada", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const handleDeleteCategory = (id: string) => {
        setDeleteConfirm({ id, type: "category" });
    };

    const confirmDeleteCategory = () => {
        if (!deleteConfirm) return;
        deleteCategoryMutation.mutate(deleteConfirm.id, {
            onSuccess: () => {
                setDeleteConfirm(null);
                refetch();
                toast("Categoría eliminada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleDeleteSubcategory = (id: string) => {
        setDeleteConfirm({ id, type: "subcategory" });
    };

    const confirmDeleteSubcategory = () => {
        if (!deleteConfirm) return;
        deleteSubcategoryMutation.mutate(deleteConfirm.id, {
            onSuccess: () => {
                setDeleteConfirm(null);
                refetch();
                toast("Subcategoría eliminada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleRestoreCategory = (id: string) => {
        restoreCategoryMutation.mutate(id, {
            onSuccess: () => {
                refetch();
                toast("Categoría restaurada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleRestoreSubcategory = (id: string) => {
        restoreSubcategoryMutation.mutate(id, {
            onSuccess: () => {
                refetch();
                toast("Subcategoría restaurada", "success");
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleHardDeleteCategory = () => {
        if (!hardDeleteConfirm) return;
        hardDeleteCategoryMutation.mutate(hardDeleteConfirm.id, {
            onSuccess: () => {
                refetch();
                toast("Categoría eliminada permanentemente", "success");
                setHardDeleteConfirm(null);
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const handleHardDeleteSubcategory = () => {
        if (!hardDeleteConfirm) return;
        hardDeleteSubcategoryMutation.mutate(hardDeleteConfirm.id, {
            onSuccess: () => {
                refetch();
                toast("Subcategoría eliminada permanentemente", "success");
                setHardDeleteConfirm(null);
            },
            onError: (err: unknown) => toast(getApiErrorMessage(err)),
        });
    };

    const startEditCategory = (cat: Category) => {
        setEditingCategoryId(cat.id);
        setEditingCategoryName(cat.name);
    };

    const saveEditCategory = () => {
        const name = editingCategoryName.trim();
        if (!editingCategoryId || !name) {
            setEditingCategoryId(null);
            return;
        }
        const exists = categoryGroups.some(
            (g) => g.category.id !== editingCategoryId && g.category.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            toast(`La categoría "${name}" ya existe`);
            return;
        }
        updateCategoryMutation.mutate(
            { id: editingCategoryId, data: { name } },
            {
                onSuccess: () => {
                    setEditingCategoryId(null);
                    setEditingCategoryName("");
                    refetch();
                    toast("Categoría actualizada", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const startEditSubcategory = (sub: Subcategory) => {
        setEditingSubcategoryId(sub.id);
        setEditingSubcategoryName(sub.name);
    };

    const saveEditSubcategory = () => {
        const name = editingSubcategoryName.trim();
        if (!editingSubcategoryId || !name) {
            setEditingSubcategoryId(null);
            return;
        }
        const parentGroup = categoryGroups.find((g) => g.subcategories.some((s) => s.id === editingSubcategoryId));
        const exists = parentGroup?.subcategories.some(
            (s) => s.id !== editingSubcategoryId && s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            toast(`La subcategoría "${name}" ya existe`);
            return;
        }
        updateSubcategoryMutation.mutate(
            { id: editingSubcategoryId, data: { name } },
            {
                onSuccess: () => {
                    setEditingSubcategoryId(null);
                    setEditingSubcategoryName("");
                    refetch();
                    toast("Subcategoría actualizada", "success");
                },
                onError: (err: unknown) => toast(getApiErrorMessage(err)),
            }
        );
    };

    if (isLoading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    const activeGroups = categoryGroups.filter((g) => !g.category.deleted_at);
    const deletedGroups = categoryGroups.filter((g) => g.category.deleted_at);

    return (
        <div>
            <InputGroup
                placeholder="Nueva categoría..."
                value={newCategoryName}
                onChange={setNewCategoryName}
                onSubmit={handleAddCategory}
                buttonLabel="Agregar"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {activeGroups.map((group) => (
                    <div
                        key={group.category.id}
                        style={cardStyle}
                    >
                        {editingCategoryId === group.category.id ? (
                            <div style={{ display: "flex", gap: spacing[2], marginBottom: spacing[2] }}>
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
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: expandedCategories.has(group.category.id) ? spacing[3] : 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: spacing[2],
                                        cursor: "pointer",
                                    }}
                                    onClick={() => toggleExpandCategory(group.category.id)}
                                    onDoubleClick={() => startEditCategory(group.category)}
                                >
                                    <ChevronRight
                                        size={16}
                                        style={{
                                            color: colors.accent.teal,
                                            transition: "transform 0.15s",
                                            transform: expandedCategories.has(group.category.id) ? "rotate(90deg)" : "rotate(0deg)",
                                        }}
                                    />
                                    <span style={{ fontWeight: 600, color: colors.fg.base, fontSize: fonts.size.sm }}>
                                        {group.category.name}
                                    </span>
                                    <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>
                                        ({group.subcategories.length})
                                    </span>
                                </div>
                                {group.category.id !== "__uncategorized__" && (
                                    <Button
                                        variant="icon"
                                        onClick={() => handleDeleteCategory(group.category.id)}
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                )}
                            </div>
                        )}

                        {expandedCategories.has(group.category.id) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[2] }}>
                                {group.subcategories.filter(s => !s.deleted_at).map((sub) =>
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
                                            style={{ ...subcategoryInputStyle, width: "auto", minWidth: "100px" }}
                                        />
                                    ) : (
                                        <div
                                            key={sub.id}
                                            onDoubleClick={() => startEditSubcategory(sub)}
                                            style={chipStyle(false)}
                                        >
                                            <span>{sub.name}</span>
                                            <Button
                                                variant="icon"
                                                onClick={() => handleDeleteSubcategory(sub.id)}
                                            >
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    )
                                )}

                                {group.subcategories.filter(s => s.deleted_at).map((sub) => (
                                    <div
                                        key={sub.id}
                                        style={{
                                            ...chipStyle(false),
                                            backgroundColor: colors.bg.surface,
                                            opacity: 0.6,
                                        }}
                                    >
                                        <span>{sub.name}</span>
                                        <span style={{ display: "flex", gap: 0 }}>
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
                                    </div>
                                ))}

                                {selectedCategoryId === group.category.id ? (
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 0, backgroundColor: colors.bg.surface, border: `1px solid ${colors.fill}`, borderRadius: radius.md, height: "26px", boxSizing: "border-box", overflow: "hidden" }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre..."
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleAddSubcategory();
                                                if (e.key === "Escape") { setSelectedCategoryId(null); setNewSubcategoryName(""); }
                                            }}
                                            autoFocus
                                            style={{ height: "24px", padding: `0 ${spacing[2]}`, backgroundColor: "transparent", border: "none", color: colors.fg.base, fontSize: fonts.size.sm, outline: "none", boxSizing: "border-box", width: "100px" }}
                                        />
                                        <div style={{ display: "flex", alignItems: "center", gap: 0, padding: `0 ${spacing[1]}`, borderLeft: `1px solid ${colors.fill}`, height: "100%" }}>
                                            <Button variant="icon" onClick={handleAddSubcategory} disabled={!newSubcategoryName.trim()} title="Guardar" style={{ height: "24px", width: "24px" }}>
                                                <Check size={10} />
                                            </Button>
                                            <Button variant="icon" onClick={() => { setSelectedCategoryId(null); setNewSubcategoryName(""); }} title="Cancelar" style={{ height: "24px", width: "24px" }}>
                                                <X size={10} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    group.category.id !== "__uncategorized__" && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategoryId(group.category.id)}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: spacing[1],
                                                padding: `${spacing[1]} ${spacing[2]}`,
                                                fontSize: fonts.size.xs,
                                                backgroundColor: "transparent",
                                                border: "none",
                                                color: colors.fg.dim,
                                                cursor: "pointer",
                                                fontWeight: 500,
                                                fontFamily: fonts.family.text,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Plus size={12} />
                                            Agregar
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
                    <h4 style={{ color: colors.fg.dim, fontSize: fonts.size.sm, marginBottom: spacing[3], fontWeight: 500 }}>
                        Categorías borradas
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                        {deletedGroups.map((group) => (
                            <div
                                key={group.category.id}
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
                                <span style={{ fontSize: fonts.size.sm }}>{group.category.name}</span>
                                <span style={{ display: "flex", gap: 0 }}>
                                    <Button
                                        variant="icon"
                                        onClick={() => handleRestoreCategory(group.category.id)}
                                        title="Restaurar"
                                    >
                                        <RotateCcw size={14} />
                                    </Button>
                                    <Button
                                        variant="icon"
                                        onClick={() => setHardDeleteConfirm({ id: group.category.id, type: "category" })}
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
                onConfirm={deleteConfirm?.type === "category" ? confirmDeleteCategory : confirmDeleteSubcategory}
                title={deleteConfirm?.type === "category" ? "Confirmar eliminación" : "Confirmar eliminación"}
                description={deleteConfirm?.type === "category" ? "¿Eliminar categoría y todas sus subcategorías?" : "¿Eliminar subcategoría?"}
                isLoading={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
            />

            <ConfirmDialog
                isOpen={!!hardDeleteConfirm}
                onClose={() => setHardDeleteConfirm(null)}
                onConfirm={hardDeleteConfirm?.type === "category" ? handleHardDeleteCategory : handleHardDeleteSubcategory}
                title="Eliminar permanentemente"
                description={
                    hardDeleteConfirm?.type === "category"
                        ? "¿Eliminar permanentemente esta categoría y todas sus transacciones asociadas? No se puede deshacer."
                        : "¿Eliminar permanentemente esta subcategoría y todas sus transacciones asociadas? No se puede deshacer."
                }
                confirmLabel="Eliminar permanentemente"
                isLoading={hardDeleteCategoryMutation.isPending || hardDeleteSubcategoryMutation.isPending}
                destructive
                requireHold
            />
        </div>
    );
}
