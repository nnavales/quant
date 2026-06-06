import { useMemo, useState } from "react";
import type { HistoricalFilters } from "@/api_client";
import { HistoricalFiltersComponent } from "@/components/HistoricalFilters";
import { HistoricalTab } from "@/components/HistoricalTab";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useHistoricalEntriesInfinite } from "@/hooks";
import { spacing, colors, flexColumn } from "@/styles";
import { fonts } from "@/styles/fonts";
import { HelpModal } from "@/components/ui/HelpModal";
import { PageHeader, HelpButton } from "@/components/ui/PageHeader";
import { helpContent } from "@/data/helpContent";

export function HistoricalPage() {
    const [filters, setFilters] = useState<HistoricalFilters>({ sort: "month", order: "desc", limit: 30 });
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

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
            <PageHeader
                title={
                    <>
                        Histórico
                        <span
                            style={{
                                fontWeight: fonts.weight.regular,
                                color: colors.fg.dim,
                                fontSize: fonts.size.sm,
                                marginLeft: spacing[2],
                            }}
                        >
                            ({total})
                        </span>
                    </>
                }
                actions={
                    <>
                        <HelpButton onClick={() => setShowHelp(true)} />
                        <Button
                            variant="chip"
                            size="sm"
                            color="default"
                            iconLeft={<Upload size={14} strokeWidth={2.5} />}
                            style={{
                                height: "30px",
                                padding: "0 14px",
                                fontSize: fonts.size.sm,
                                border: "none",
                                borderRadius: "8px",
                                transition: "filter 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.filter = "brightness(1.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.filter = "";
                            }}
                            onClick={() => setShowBulkImport(true)}
                        >
                            Importar CSV
                        </Button>
                    </>
                }
            >
                <HistoricalFiltersComponent filters={filters} onChange={setFilters} noMargin />
            </PageHeader>

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

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                title={helpContent.historical.title}
                intro={helpContent.historical.intro}
                sections={helpContent.historical.sections}
            />
        </div>
    );
}
