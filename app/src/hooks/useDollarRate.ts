import { useEffect, useCallback, useRef } from "react";
import { economic } from "@/api_client";

export function useDollarRate(
    dollarSource: string | undefined,
    dollarBanks: Record<string, { sell: number }> | undefined,
    onRateChange: (rate: number) => void,
    defaultRate?: string
) {
    const onRateChangeRef = useRef(onRateChange);
    onRateChangeRef.current = onRateChange;

    useEffect(() => {
        if (dollarSource && dollarBanks) {
            const bankValue = dollarBanks[dollarSource];
            if (bankValue) {
                onRateChangeRef.current(bankValue.sell);
                return;
            }
        }
        if (defaultRate) {
            onRateChangeRef.current(parseFloat(defaultRate));
        }
    }, [dollarSource, dollarBanks, defaultRate]);

    const refreshRate = useCallback(async () => {
        if (!dollarSource) return;
        const banks = await economic.getDollarBanks(undefined, true);
        if (banks) {
            const bankValue = banks[dollarSource];
            if (bankValue) {
                onRateChangeRef.current(bankValue.sell);
                return;
            }
        }
        if (defaultRate) {
            onRateChangeRef.current(parseFloat(defaultRate));
        }
    }, [dollarSource, defaultRate]);

    return { refreshRate };
}
