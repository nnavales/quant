export function getApiErrorMessage(err: unknown): string {
    if (!(err instanceof Error)) return "Error desconocido";
    const msg = err.message.toLowerCase().trim();

    // Network / connection errors (exact and substring matches)
    if (msg === "network error" || msg.includes("network error")) return "Error de conexión";
    if (msg === "timeout" || msg.includes("timeout")) return "Tiempo de espera agotado";
    if (msg === "service unavailable" || msg.includes("service unavailable")) return "Error de conexión";
    if (msg === "upstream error" || msg.includes("upstream error")) return "Error de conexión externa";
    if (msg === "upstream timeout" || msg.includes("upstream timeout")) return "Tiempo de espera agotado";

    // Axios default messages for status codes
    if (msg.includes("request failed with status code 504")) return "Tiempo de espera agotado";
    if (msg.includes("request failed with status code 503")) return "Servicio no disponible";
    if (msg.includes("request failed with status code 502")) return "Error de conexión externa";
    if (msg.includes("request failed with status code 500")) return "Error interno del servidor";
    if (msg.includes("request failed with status code 404")) return "El recurso no existe";
    if (msg.includes("request failed with status code 409")) return "El recurso ya existe";
    if (msg.includes("request failed with status code 400")) return "Datos inválidos";

    // Backend generic messages
    if (msg === "not found" || msg.includes("not found")) return "El recurso no existe";
    if (msg === "invalid input" || msg.includes("invalid input")) return "Datos inválidos";
    if (msg === "internal error" || msg.includes("internal error")) return "Error interno del servidor";
    if (msg === "conflict" || msg.includes("conflict")) return "Conflicto de datos";
    if (msg === "unauthorized" || msg.includes("unauthorized")) return "No autorizado";
    if (msg === "forbidden" || msg.includes("forbidden")) return "Acceso denegado";

    // Resource-specific duplicate messages
    if (msg.includes("category already exists")) return "La categoría ya existe";
    if (msg.includes("subcategory already exists")) return "La subcategoría ya existe";
    if (msg.includes("channel already exists")) return "El canal ya existe";
    if (msg.includes("account already exists")) return "La cuenta ya existe";
    if (msg.includes("preset already exists")) return "El preset ya existe";
    if (msg === "already exists" || msg.includes("already exists")) return "El recurso ya existe";

    return err.message;
}
