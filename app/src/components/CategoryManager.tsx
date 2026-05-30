import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Check, ChevronRight, Plus, RotateCcw, Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { toast } from "@/utils/toast";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import {
    cardStyle,
    rowStyle,
    inputStyle,
    flexBetween,
    flexColumn,
    flexRow,
    truncate,
} from "@/styles/layout";
import { SettingsCard } from "@/components/SettingsCard";

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

    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
    const [editingSubcategoryName, setEditingSubcategoryName] = useState("");

    const [showSubcategoryForm, setShowSubcategoryForm] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        id: string;
        type: "category" | "subcategory";
    } | null>(null);
    const [hardDeleteConfirm, setHardDeleteConfirm] = useState<{
        id: string;
        type: "category" | "subcategory";
    } | null>(null);
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
        const exists = categoryGroups.some(
            (g) => g.category.name.toLowerCase() === name.toLowerCase()
        );
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

    const handleAddSubcategory = (categoryId: string) => {
        const name = newSubcategoryName.trim();
        if (!name) return;
        const group = categoryGroups.find((g) => g.category.id === categoryId);
        const exists = group?.subcategories.some(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            toast(`La subcategoría "${name}" ya existe`);
            return;
        }
        createSubcategoryMutation.mutate(
            { name, category_id: categoryId },
            {
                onSuccess: () => {
                    setNewSubcategoryName("");
                    setShowSubcategoryForm(null);
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
        const originalCat = categoryGroups.find(
            (g) => g.category.id === editingCategoryId
        )?.category;
        if (originalCat && originalCat.name === name) {
            setEditingCategoryId(null);
            setEditingCategoryName("");
            return;
        }
        const exists = categoryGroups.some(
            (g) =>
                g.category.id !== editingCategoryId &&
                g.category.name.toLowerCase() === name.toLowerCase()
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
        const allSubs = categoryGroups.flatMap((g) => g.subcategories);
        const originalSub = allSubs.find((s) => s.id === editingSubcategoryId);
        if (originalSub && originalSub.name === name) {
            setEditingSubcategoryId(null);
            setEditingSubcategoryName("");
            return;
        }
        const parentGroup = categoryGroups.find((g) =>
            g.subcategories.some((s) => s.id === editingSubcategoryId)
        );
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

    if (isLoading)
        return (
            <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>
                Cargando...
            </div>
        );

    const activeGroups = categoryGroups.filter((g) => !g.category.deleted_at);
    const deletedGroups = categoryGroups.filter((g) => g.category.deleted_at);

    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            <SettingsCard>
                <InputGroup
                    placeholder="Nueva categoría..."
                    value={newCategoryName}
                    onChange={setNewCategoryName}
                    onSubmit={handleAddCategory}
                    buttonLabel="Agregar"
                />
            </SettingsCard>

            <div style={{ ...flexColumn, gap: spacing[3] }}>
                {activeGroups.map((group) => (
                    <div
                        key={group.category.id}
                        style={{ ...cardStyle, backgroundColor: colors.bg.elevated }}
                    >
                        {editingCategoryId === group.category.id ? (
                            <div style={{ ...flexBetween, gap: spacing[5] }}>
                                <div style={{ ...flexRow, gap: spacing[2], flex: 1, minWidth: 0 }}>
                                    <ChevronRight
                                        size={16}
                                        style={{
                                            color: colors.fg.dim,
                                            flexShrink: 0,
                                            transition: "transform 0.15s",
                                            transform: expandedCategories.has(group.category.id)
                                                ? "rotate(90deg)"
                                                : "rotate(0deg)",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => toggleExpandCategory(group.category.id)}
                                    />
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: spacing[2],
                                            alignItems: "center",
                                            flex: 1,
                                            padding: spacing[1],
                                            backgroundColor: colors.bg.surface,
                                            borderRadius: radius.md,
                                            overflow: "hidden",
                                            height: "32px",
                                        }}
                                    >
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
                                            style={{
                                                ...inputStyle,
                                                flex: 1,
                                                border: "none",
                                                minWidth: 0,
                                            }}
                                        />
                                        {group.category.id !== "__uncategorized__" && (
                                            <span
                                                style={{
                                                    display: "flex",
                                                    gap: spacing[1],
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button variant="icon" onClick={saveEditCategory}>
                                                    <Check size={14} />
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    onClick={() => setEditingCategoryId(null)}
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    ...flexBetween,
                                    gap: spacing[5],
                                }}
                            >
                                <div
                                    style={{
                                        ...flexRow,
                                        gap: spacing[2],
                                        cursor: "pointer",
                                        flex: 1,
                                        minWidth: 0,
                                    }}
                                    onClick={() => toggleExpandCategory(group.category.id)}
                                >
                                    <ChevronRight
                                        size={16}
                                        style={{
                                            color: colors.fg.dim,
                                            flexShrink: 0,
                                            transition: "transform 0.15s",
                                            transform: expandedCategories.has(group.category.id)
                                                ? "rotate(90deg)"
                                                : "rotate(0deg)",
                                        }}
                                    />
                                    <span
                                        style={{
                                            ...truncate,
                                            fontWeight: fonts.weight.semibold,
                                            color: colors.fg.base,
                                            fontSize: fonts.size.sm,
                                            flex: 1,
                                            minWidth: 0,
                                            paddingRight: spacing[2],
                                        }}
                                    >
                                        {group.category.name}
                                    </span>
                                </div>
                                {group.category.id !== "__uncategorized__" && (
                                    <span
                                        style={{ display: "flex", gap: spacing[1], flexShrink: 0 }}
                                    >
                                        <Button
                                            variant="icon"
                                            onClick={() => startEditCategory(group.category)}
                                            title="Editar"
                                        >
                                            <Pencil size={14} />
                                        </Button>
                                        <Button
                                            variant="icon"
                                            onClick={() => handleDeleteCategory(group.category.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </span>
                                )}
                            </div>
                        )}

                        {expandedCategories.has(group.category.id) && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: spacing[1],
                                    marginTop: spacing[3],
                                    paddingLeft: spacing[6],
                                    borderLeft: `1px solid ${colors.fill}`,
                                }}
                            >
                                {group.subcategories
                                    .filter((s) => !s.deleted_at)
                                    .map((sub) => (
                                        <div key={sub.id}>
                                            {editingSubcategoryId === sub.id ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: spacing[2],
                                                        alignItems: "center",
                                                        padding: spacing[1],
                                                        backgroundColor: colors.bg.surface,
                                                        borderRadius: radius.md,
                                                        overflow: "hidden",
                                                        height: "32px",
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        value={editingSubcategoryName}
                                                        onChange={(e) =>
                                                            setEditingSubcategoryName(
                                                                e.target.value
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter")
                                                                saveEditSubcategory();
                                                            if (e.key === "Escape")
                                                                setEditingSubcategoryId(null);
                                                        }}
                                                        autoFocus
                                                        placeholder="Nombre"
                                                        style={{
                                                            ...inputStyle,
                                                            flex: 1,
                                                            minWidth: 0,
                                                            border: "none",
                                                        }}
                                                    />
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: spacing[1],
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Button
                                                            variant="icon"
                                                            onClick={saveEditSubcategory}
                                                        >
                                                            <Check size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="icon"
                                                            onClick={() =>
                                                                setEditingSubcategoryId(null)
                                                            }
                                                        >
                                                            <X size={14} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        ...rowStyle,
                                                        paddingRight: 0,
                                                        gap: spacing[5],
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            ...flexRow,
                                                            gap: spacing[2],
                                                            flex: 1,
                                                            minWidth: 0,
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                ...truncate,
                                                                fontSize: fonts.size.sm,
                                                                color: colors.fg.base,
                                                            }}
                                                        >
                                                            {sub.name}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: spacing[1],
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Button
                                                            variant="icon"
                                                            title="Editar"
                                                            onClick={() =>
                                                                startEditSubcategory(sub)
                                                            }
                                                        >
                                                            <Pencil size={12} />
                                                        </Button>
                                                        <Button
                                                            variant="icon"
                                                            title="Eliminar"
                                                            onClick={() =>
                                                                handleDeleteSubcategory(sub.id)
                                                            }
                                                        >
                                                            <Trash2 size={12} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {group.subcategories
                                    .filter((s) => s.deleted_at)
                                    .map((sub) => (
                                        <div
                                            key={sub.id}
                                            style={{
                                                ...rowStyle,
                                                opacity: 0.6,
                                                backgroundColor: colors.bg.surface,
                                                paddingRight: 0,
                                                gap: spacing[5],
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...flexRow,
                                                    gap: spacing[2],
                                                    flex: 1,
                                                    minWidth: 0,
                                                    overflow: "hidden",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        ...truncate,
                                                        fontSize: fonts.size.sm,
                                                        color: colors.fg.dim,
                                                    }}
                                                >
                                                    {sub.name}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    display: "flex",
                                                    gap: spacing[1],
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <Button
                                                    variant="icon"
                                                    onClick={() => handleRestoreSubcategory(sub.id)}
                                                    title="Restaurar"
                                                >
                                                    <RotateCcw size={12} />
                                                </Button>
                                                <Button
                                                    variant="icon"
                                                    onClick={() =>
                                                        setHardDeleteConfirm({
                                                            id: sub.id,
                                                            type: "subcategory",
                                                        })
                                                    }
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2
                                                        size={12}
                                                        style={{ color: colors.accent.red }}
                                                    />
                                                </Button>
                                            </span>
                                        </div>
                                    ))}

                                {showSubcategoryForm === group.category.id ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: spacing[2],
                                            alignItems: "center",
                                            padding: spacing[1],
                                            backgroundColor: colors.bg.surface,
                                            borderRadius: radius.md,
                                            overflow: "hidden",
                                            height: "32px",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Nombre..."
                                            value={newSubcategoryName}
                                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                                            onKeyDown={(e) =>
                                                e.key === "Enter" &&
                                                handleAddSubcategory(group.category.id)
                                            }
                                            style={{
                                                ...inputStyle,
                                                flex: 1,
                                                minWidth: 0,
                                                border: "none",
                                            }}
                                            autoFocus
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: spacing[1],
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Button
                                                variant="icon"
                                                onClick={() =>
                                                    handleAddSubcategory(group.category.id)
                                                }
                                            >
                                                <Check size={14} />
                                            </Button>
                                            <Button
                                                variant="icon"
                                                onClick={() => setShowSubcategoryForm(null)}
                                            >
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    group.category.id !== "__uncategorized__" && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSubcategoryForm(group.category.id)
                                            }
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = colors.fg.base;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = colors.fg.dim;
                                            }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: spacing[1],
                                                padding: `${spacing[1]} ${spacing[2]}`,
                                                fontSize: fonts.size.sm,
                                                backgroundColor: "transparent",
                                                border: "none",
                                                color: colors.fg.dim,
                                                cursor: "pointer",
                                                fontWeight: fonts.weight.medium,
                                                fontFamily: fonts.family,
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            <Plus size={14} />
                                            Agregar subcategoría
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
                    <h4
                        style={{
                            color: colors.fg.dim,
                            fontSize: fonts.size.sm,
                            marginBottom: spacing[3],
                            fontWeight: fonts.weight.medium,
                        }}
                    >
                        Categorías borradas
                    </h4>
                    <div style={{ ...flexColumn, gap: spacing[2] }}>
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
                                <span style={{ fontSize: fonts.size.sm }}>
                                    {group.category.name}
                                </span>
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
                                        onClick={() =>
                                            setHardDeleteConfirm({
                                                id: group.category.id,
                                                type: "category",
                                            })
                                        }
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
                onConfirm={
                    deleteConfirm?.type === "category"
                        ? confirmDeleteCategory
                        : confirmDeleteSubcategory
                }
                title="Confirmar eliminación"
                description={
                    deleteConfirm?.type === "category"
                        ? "¿Eliminar categoría y todas sus subcategorías?"
                        : "¿Eliminar subcategoría?"
                }
                isLoading={deleteCategoryMutation.isPending || deleteSubcategoryMutation.isPending}
            />

            <ConfirmDialog
                isOpen={!!hardDeleteConfirm}
                onClose={() => setHardDeleteConfirm(null)}
                onConfirm={
                    hardDeleteConfirm?.type === "category"
                        ? handleHardDeleteCategory
                        : handleHardDeleteSubcategory
                }
                title="Eliminar permanentemente"
                description={
                    hardDeleteConfirm?.type === "category"
                        ? "¿Eliminar permanentemente esta categoría y todas sus transacciones asociadas? No se puede deshacer."
                        : "¿Eliminar permanentemente esta subcategoría y todas sus transacciones asociadas? No se puede deshacer."
                }
                confirmLabel="Eliminar permanentemente"
                isLoading={
                    hardDeleteCategoryMutation.isPending || hardDeleteSubcategoryMutation.isPending
                }
                destructive
                requireHold
            />
        </div>
    );
}
