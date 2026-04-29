import { useMemo } from "react";
import type { Channel, Account, Category, Subcategory } from "@/api_client/types";

export interface GroupedChannel {
    channel: Channel;
    accounts: Account[];
}

export interface GroupedCategory {
    category: Category;
    subcategories: Subcategory[];
}

export function useGroupedChannels(
    channelsWithAccounts?: { channel: Channel; accounts?: Account[] | null }[],
    allAccounts?: Account[]
): GroupedChannel[] {
    return useMemo(() => {
        if (!channelsWithAccounts || !allAccounts) return [];

        const grouped: GroupedChannel[] = channelsWithAccounts.map((cwa) => ({
            channel: cwa.channel,
            accounts: cwa.accounts ?? [],
        }));

        const orphaned = allAccounts.filter(
            (acc) => !channelsWithAccounts.some((cwa) => cwa.channel?.id === acc.channel_id)
        );

        if (orphaned.length > 0) {
            grouped.push({
                channel: { id: "__uncategorized__", name: "Sin canal", created_at: "", updated_at: null, deleted_at: null },
                accounts: orphaned,
            });
        }

        return grouped;
    }, [channelsWithAccounts, allAccounts]);
}

export function useGroupedCategories(
    categoriesWithSubcategories?: { category: Category; subcategories?: Subcategory[] | null }[],
    allSubcategories?: Subcategory[]
): GroupedCategory[] {
    return useMemo(() => {
        if (!categoriesWithSubcategories || !allSubcategories) return [];

        const grouped: GroupedCategory[] = categoriesWithSubcategories.map((cws) => ({
            category: cws.category,
            subcategories: cws.subcategories ?? [],
        }));

        const orphaned = allSubcategories.filter(
            (sub) => !categoriesWithSubcategories.some((cws) => cws.category.id === sub.category_id)
        );

        if (orphaned.length > 0) {
            grouped.push({
                category: { id: "__uncategorized__", name: "Sin categoría", created_at: "", updated_at: null, deleted_at: null },
                subcategories: orphaned,
            });
        }

        return grouped;
    }, [categoriesWithSubcategories, allSubcategories]);
}