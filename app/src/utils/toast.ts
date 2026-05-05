export type ToastType = "error" | "success" | "warning";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(message: string, type: ToastType = "error") {
    const t: Toast = { id: ++toastId, message, type };
    listeners.forEach((listener) => listener(t));
}

export function addToastListener(listener: (toast: Toast) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
