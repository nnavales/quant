import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categories, subcategories, type CategoryReq, type SubcategoryReq } from "@/api_client";

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: () => categories.list(),
    });
}

export function useCategoriesWithSubcategories() {
    return useQuery({
        queryKey: ["categories", "with-subcategories"],
        queryFn: () => categories.listWithSubcategories(),
    });
}

export function useCategory(id: string) {
    return useQuery({
        queryKey: ["category", id],
        queryFn: () => categories.get(id),
        enabled: !!id,
    });
}

export function useCreateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoryReq> }) =>
            categories.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useRestoreCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.restore,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useHardDeleteCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: categories.hardDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useSubcategories() {
    return useQuery({
        queryKey: ["subcategories"],
        queryFn: () => subcategories.list(),
    });
}

export function useSubcategory(id: string) {
    return useQuery({
        queryKey: ["subcategory", id],
        queryFn: () => subcategories.get(id),
        enabled: !!id,
    });
}

export function useCreateSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useUpdateSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SubcategoryReq> }) =>
            subcategories.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useDeleteSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useRestoreSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.restore,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}

export function useHardDeleteSubcategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: subcategories.hardDelete,
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
