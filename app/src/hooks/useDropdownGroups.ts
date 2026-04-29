import { useMemo } from "react";
import type { DropdownGroup } from "@/components/ui/Dropdown";
import type { Category, Subcategory, Channel, Account } from "@/api_client/types";

export function useCategoryGroups(
    categories: Category[],
    subcategories: Subcategory[]
): {
    groups: DropdownGroup[];
    getCategoryId: (subcategoryId: string) => string;
} {
    const groups = useMemo(
        () =>
            categories
                .map((cat) => ({
                    label: cat.name,
                    items: subcategories
                        .filter((s) => s.category_id === cat.id)
                        .map((s) => ({ id: s.id, label: s.name })),
                }))
                .filter((g) => g.items.length > 0),
        [categories, subcategories]
    );

    const getCategoryId = (subcategoryId: string) =>
        subcategories.find((s) => s.id === subcategoryId)?.category_id || "";

    return { groups, getCategoryId };
}

export function useAccountGroups(
    channels: Channel[],
    accounts: Account[]
): {
    groups: DropdownGroup[];
    getChannelId: (accountId: string) => string;
} {
    const groups = useMemo(
        () =>
            channels
                .map((ch) => ({
                    label: ch.name,
                    items: accounts
                        .filter((a) => a.channel_id === ch.id)
                        .map((a) => ({ id: a.id, label: a.name })),
                }))
                .filter((g) => g.items.length > 0),
        [channels, accounts]
    );

    const getChannelId = (accountId: string) =>
        accounts.find((a) => a.id === accountId)?.channel_id || "";

    return { groups, getChannelId };
}
