export function getApiErrorMessage(err: unknown): string {
    if (!(err instanceof Error)) return "Error desconocido";
    const msg = err.message.toLowerCase().trim();

    // Chatbot agent config (checked first so "model not found" beats generic "not found")
    if (msg.includes("invalid api key")) return "API key inválida";
    if (msg.includes("api key no access")) return "La API key no tiene acceso a este modelo";
    if (msg.includes("model not listed")) return "El modelo no figura en la lista del proveedor";
    if (msg.includes("model not compatible")) return "El modelo no es compatible (¿soporta herramientas?)";
    if (msg.includes("model not found")) return "El modelo no existe en el proveedor";
    if (msg.includes("provider unreachable")) return "No se pudo conectar con el proveedor, revisá la Base URL";
    if (msg.includes("provider rate limited")) return "Límite de uso del proveedor alcanzado, probá más tarde";
    if (msg.includes("provider returned error")) return "El proveedor respondió con un error, revisá la API key y la Base URL";
    if (msg.includes("provider rejected request")) return "El proveedor rechazó la solicitud";
    if (msg.includes("provider error")) return "El proveedor tuvo un error, probá de nuevo";
    if (msg.includes("agent validation failed")) return "No se pudo validar el agente, revisá los datos";
    if (msg.includes("api key required")) return "Falta la API key";
    if (msg.includes("model id required")) return "Falta el Model ID";
    if (msg.includes("base url required")) return "Falta la Base URL";

    // Chatbot Telegram config
    if (msg.includes("telegram chat not started")) return "Enviá /start al bot desde tu cuenta y reintentá";
    if (msg.includes("telegram chat invalid")) return "El chat de Telegram no existe o el ID es inválido";
    if (msg.includes("telegram token invalid")) return "Token de Telegram inválido";
    if (msg.includes("telegram token required")) return "Falta el token de Telegram";
    if (msg.includes("telegram id required")) return "Falta el ID de Telegram";
    if (msg.includes("telegram request failed")) return "No se pudo contactar a Telegram";
    if (msg.includes("telegram api error")) return "Error de Telegram";
    if (msg.includes("telegram send failed")) return "No se pudo enviar el mensaje de prueba";

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
