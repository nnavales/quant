import { useMemo, useState } from "react";
import type { HistoricalFilters } from "@/api_client";
import { HistoricalFiltersComponent } from "@/components/HistoricalFilters";
import { HistoricalTab } from "@/components/HistoricalTab";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useHistoricalEntriesInfinite } from "@/hooks";
import { spacing, colors, flexColumn } from "@/styles";
import { fonts } from "@/styles/fonts";

export function HistoricalPage() {
    const [filters, setFilters] = useState<HistoricalFilters>({ sort: "month", order: "desc", limit: 30 });
    const [showBulkImport, setShowBulkImport] = useState(false);

    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useHistoricalEntriesInfinite(filters);
    const entries = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data?.pages]);
    const total = data?.pages[0]?.total ?? 0;

    return (
        <div
            style={{
                padding: spacing[3],
                ...flexColumn,
                gap: spacing[3],
                height: "100%",
                animation: "fadeIn 0.2s ease-out",
            }}
        >
            <div
                style={{
                    ...flexColumn,
                    gap: spacing[2],
                    flexShrink: 0,
                    minHeight: "64px",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1
                            style={{
                                fontFamily: fonts.family,
                                fontSize: fonts.size.xl,
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                margin: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: spacing[2],
                            }}
                        >
                            <span>Histórico</span>
                            <span
                                style={{
                                    fontWeight: fonts.weight.regular,
                                    color: colors.fg.dim,
                                    fontSize: fonts.size.sm,
                                    marginLeft: spacing[1],
                                }}
                            >
                                ({total})
                            </span>
                        </h1>
                    </div>
                    <Button
                        variant="chip"
                        size="sm"
                        color="default"
                        iconLeft={<Upload size={14} />}
                        style={{
                            height: "30px",
                            padding: "0 14px",
                            fontSize: fonts.size.sm,
                            border: "none",
                            borderRadius: "8px",
                            transition: "background-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.border;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.fill;
                        }}
                        onClick={() => setShowBulkImport(true)}
                    >
                        Importar CSV
                    </Button>
                </div>
                <HistoricalFiltersComponent filters={filters} onChange={setFilters} noMargin />
            </div>

            <HistoricalTab
                showBulkImport={showBulkImport}
                onCloseBulkImport={() => setShowBulkImport(false)}
                filters={filters}
                onFiltersChange={setFilters}
                entries={entries}
                isLoading={isLoading}
                isError={isError}
                error={error}
                fetchNextPage={fetchNextPage}
                hasNextPage={hasNextPage ?? false}
                isFetchingNextPage={isFetchingNextPage}
            />
        </div>
    );
}
