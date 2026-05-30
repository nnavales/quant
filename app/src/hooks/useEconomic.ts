import { useQuery } from "@tanstack/react-query";
import { economic } from "@/api_client";

export function useIPC() {
    return useQuery({
        queryKey: ["economic", "ipc"],
        queryFn: () => economic.getIPC(),
    });
}

export function useInflation() {
    return useQuery({
        queryKey: ["economic", "inflation"],
        queryFn: () => economic.getInflation(false),
    });
}

export function useDollarHistoric(quotation?: string) {
    return useQuery({
        queryKey: ["economic", "dollar-historic", quotation],
        queryFn: () => economic.getDollarHistoric(quotation, false),
    });
}

export function useDollarBanks(quotation?: string, refresh?: boolean) {
    return useQuery({
        queryKey: ["economic", "dollar-banks", quotation, refresh],
        queryFn: () => economic.getDollarBanks(quotation, refresh),
    });
}

export function useCrypto(symbol?: string) {
    return useQuery({
        queryKey: ["economic", "crypto", symbol],
        queryFn: () => economic.getCrypto(symbol, false),
    });
}

export function useCountryRisk() {
    return useQuery({
        queryKey: ["economic", "country-risk"],
        queryFn: () => economic.getCountryRisk(false),
    });
}

export function useFixedDeposits() {
    return useQuery({
        queryKey: ["economic", "fixed-deposits"],
        queryFn: () => economic.getFixedDeposits(false),
    });
}

export function useYieldAccounts() {
    return useQuery({
        queryKey: ["economic", "yield-accounts"],
        queryFn: () => economic.getYieldAccounts(false),
    });
}

export function useLoans() {
    return useQuery({
        queryKey: ["economic", "loans"],
        queryFn: () => economic.getLoans(false),
    });
}
