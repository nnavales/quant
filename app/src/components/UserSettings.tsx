import { useState, useEffect } from "react";
import { useUserConfig, useUpdateUserConfig } from "@/hooks";
import { toast } from "@/components/ui/Toast";

const timezoneOptions = [
    { value: "arg", label: "Argentina (UTC-3)" },
    { value: "utc", label: "UTC" },
    { value: "us_eastern", label: "US Eastern (UTC-5)" },
    { value: "us_pacific", label: "US Pacific (UTC-8)" },
    { value: "europe_london", label: "Europe/London (UTC+0)" },
];

const dollarSourceOptions = [
    { value: "banco-nacion", label: "Banco Nación" },
    { value: "banco-macro", label: "Banco Macro" },
    { value: "banco-santander", label: "Banco Santander" },
    { value: "banco-provinci", label: "Banco Provincia" },
    { value: "banco-ciudad", label: "Banco Ciudad" },
    { value: "buenbit", label: "Buenbit" },
    { value: "uala", label: "Uala" },
];

const currencyOptions = [
    { value: "ars", label: "ARS" },
    { value: "usd", label: "USD" },
];

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--fg-dim)",
    marginBottom: "var(--spacing-1)",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 10px",
    fontSize: "var(--font-size-sm)",
    color: "var(--fg-default)",
    backgroundColor: "var(--bg-dim)",
    border: "1px solid var(--highlight-medium)",
    borderRadius: "var(--radius-md)",
    outline: "none",
    boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
};

const sectionStyle: React.CSSProperties = {
    marginBottom: "var(--spacing-5)",
};

const buttonStyle: React.CSSProperties = {
    padding: "6px 14px",
    fontSize: "var(--font-size-sm)",
    fontWeight: 500,
    color: "var(--bg-default)",
    backgroundColor: "var(--accent-teal)",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
};

export function UserSettings() {
    const { data: config, isLoading, isError } = useUserConfig();
    const updateMutation = useUpdateUserConfig();

    const [username, setUsername] = useState("");
    const [currency, setCurrency] = useState("ars");
    const [dollarSource, setDollarSource] = useState("bna");
    const [timezone, setTimezone] = useState("arg");

    useEffect(() => {
        if (config) {
            setUsername(config.username ?? "");
            setCurrency(config.currency ?? "ars");
            setDollarSource(config.dollar_source ?? "bna");
            setTimezone(config.timezone ?? "arg");
        }
    }, [config]);

    function handleSave() {
        updateMutation.mutate(
            { username, currency, dollar_source: dollarSource, timezone },
            {
                onSuccess: () => {
                    toast("Configuracion guardada", "success");
                },
                onError: (err: unknown) => {
                    toast(err instanceof Error ? err.message : "Error al guardar");
                },
            }
        );
    }

    if (isLoading) return <div style={{ color: "var(--fg-muted)", textAlign: "center", padding: "var(--spacing-8)" }}>Cargando...</div>;
    if (isError) return <div style={{ color: "var(--semantic-error)", textAlign: "center", padding: "var(--spacing-8)" }}>Error al cargar configuracion</div>;

    return (
        <div style={{ maxWidth: "400px" }}>
            <div style={sectionStyle}>
                <label style={labelStyle}>Usuario</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputStyle}
                    placeholder="Tu nombre"
                />
            </div>

            <div style={sectionStyle}>
                <label style={labelStyle}>Moneda</label>
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    style={selectStyle}
                >
                    {currencyOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div style={sectionStyle}>
                <label style={labelStyle}>Fuente del dolar</label>
                <select
                    value={dollarSource}
                    onChange={(e) => setDollarSource(e.target.value)}
                    style={selectStyle}
                >
                    {dollarSourceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <div style={sectionStyle}>
                <label style={labelStyle}>Zona horaria</label>
                <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={selectStyle}
                >
                    {timezoneOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                style={{
                    ...buttonStyle,
                    opacity: updateMutation.isPending ? 0.6 : 1,
                    cursor: updateMutation.isPending ? "not-allowed" : "pointer",
                }}
            >
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
        </div>
    );
}