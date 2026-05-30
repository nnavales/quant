import { useMutation, useQueryClient } from "@tanstack/react-query";
import { backup } from "@/api_client";

type BackupResource =
    | "transactions"
    | "historical"
    | "networth"
    | "presets"
    | "planning-inputs"
    | "planning-goals"
    | "planning-exchange-rates"
    | "planning-config";

export function useExportBackup() {
    return useMutation({
        mutationFn: () => backup.export(),
    });
}

export function useImportBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ resource, file }: { resource: BackupResource; file: File }) =>
            backup.import(resource, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ refetchType: "active" });
        },
    });
}
