import { useState, useEffect } from "react";
import { useUserConfig, useUpdateUserConfig, useDollarBanks } from "@/hooks";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { colors, presets } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle } from "@/styles/layout";
import { invoke } from "@tauri-apps/api/core";

const sectionHeaderStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    fontWeight: 600,
    color: colors.fg.dim,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: spacing[3],
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "32px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
};

const timezoneOptions: DropdownOption[] = [
    { id: "America/Argentina/Buenos_Aires", label: "Argentina (UTC-3)" },
    { id: "UTC", label: "UTC" },
    { id: "America/New_York", label: "US Eastern (UTC-5)" },
    { id: "America/Los_Angeles", label: "US Pacific (UTC-8)" },
    { id: "Europe/London", label: "Europe/London (UTC+0)" },
];

const dateFormatOptions: DropdownOption[] = [
    { id: "YYYY/MM/DD", label: "YYYY/MM/DD (2024/01/15)" },
    { id: "DD/MM/YYYY", label: "DD/MM/YYYY (15/01/2024)" },
    { id: "MM/DD/YYYY", label: "MM/DD/YYYY (01/15/2024)" },
    { id: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-01-15)" },
    { id: "DD-MM-YYYY", label: "DD-MM-YYYY (15-01-2024)" },
    { id: "MM-DD-YYYY", label: "MM-DD-YYYY (01-15-2024)" },
];

export function UserSettings() {
    const { data: config, isLoading, isError } = useUserConfig();
    const { data: dollarBanks } = useDollarBanks();
    const updateMutation = useUpdateUserConfig();

    const [username, setUsername] = useState("");
    const [dollarSource, setDollarSource] = useState("");
    const [timezone, setTimezone] = useState("America/Argentina/Buenos_Aires");
    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [defaultRate, setDefaultRate] = useState("");
    const [theme, setTheme] = useState("dark");
    const [daemonMode, setDaemonMode] = useState("user");
    const [isDevEnv, setIsDevEnv] = useState(false);

    const themeOptions: DropdownOption[] = Object.keys(presets).map((id) => ({
        id,
        label: id
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
    }));

    useEffect(() => {
        if (config) {
            setUsername(config.username ?? "");
            setDollarSource(config.dollar_source ?? "");
            setTimezone(config.timezone ?? "America/Argentina/Buenos_Aires");
            setDateFormat(config.date_format ?? "DD/MM/YYYY");
            setDefaultRate(config.default_rate ?? "");
            setTheme(config.theme ?? "dark");
        }
    }, [config]);

    useEffect(() => {
        invoke("get_mode")
            .then((mode) => setDaemonMode(mode as string))
            .catch(() => {});

        invoke("is_dev")
            .then((dev) => setIsDevEnv(!!dev))
            .catch(() => {});
    }, []);

    const dollarSourceOptions: DropdownOption[] = dollarBanks
        ? [
              { id: "", label: `Default (${defaultRate || "sin tasa"})` },
              ...Object.entries(dollarBanks).map(([slug, bank]) => ({
                  id: slug,
                  label: bank.entity,
              })),
          ]
        : [{ id: "", label: `Default (${defaultRate || "sin tasa"})` }];

    function autoSave(data: Record<string, string>) {
        updateMutation.mutate(data, {
            onSuccess: () => toast("Configuración guardada", "success"),
            onError: (err: unknown) => {
                toast(getApiErrorMessage(err));
            },
        });
    }

    function getSaveData(overrides?: Record<string, string>) {
        return { username, dollar_source: dollarSource, timezone, date_format: dateFormat, default_rate: defaultRate, theme, ...overrides };
    }

    const isUsernameDirty = username !== (config?.username ?? "");
    const isDefaultRateDirty = defaultRate !== (config?.default_rate ?? "");

    const saveUsername = () => {
        autoSave(getSaveData());
    };

    const cancelUsername = () => {
        setUsername(config?.username ?? "");
    };

    const saveDefaultRate = () => {
        autoSave(getSaveData());
    };

    const cancelDefaultRate = () => {
        setDefaultRate(config?.default_rate ?? "");
    };

    if (isLoading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;
    if (isError) return <div style={{ color: colors.accent.red, textAlign: "center", padding: spacing[8] }}>Error al cargar configuracion</div>;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Usuario</h3>
                <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveUsername(); if (e.key === "Escape") cancelUsername(); }}
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="Tu nombre"
                    />
                    {isUsernameDirty && (
                        <div style={{ display: "flex", gap: spacing[1] }}>
                            <Button variant="icon" onClick={saveUsername}>
                                <Check size={14} />
                            </Button>
                            <Button variant="icon" onClick={cancelUsername}>
                                <X size={14} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Fuente del dolar</h3>
                <Dropdown
                    value={dollarSource}
                    onChange={(id) => {
                        setDollarSource(id);
                        autoSave(getSaveData({ dollar_source: id }));
                    }}
                    options={dollarSourceOptions}
                    placeholder="Seleccionar..."
                    triggerStyle={{ height: "32px", fontSize: fonts.size.sm }}
                />
            </div>

            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Tipo de cambio default</h3>
                <div style={{ display: "flex", gap: spacing[2], alignItems: "center" }}>
                    <input
                        type="number"
                        value={defaultRate}
                        onChange={(e) => setDefaultRate(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveDefaultRate(); if (e.key === "Escape") cancelDefaultRate(); }}
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="1400"
                    />
                    {isDefaultRateDirty && (
                        <div style={{ display: "flex", gap: spacing[1] }}>
                            <Button variant="icon" onClick={saveDefaultRate}>
                                <Check size={14} />
                            </Button>
                            <Button variant="icon" onClick={cancelDefaultRate}>
                                <X size={14} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Zona horaria</h3>
                <Dropdown
                    value={timezone}
                    onChange={(id) => {
                        setTimezone(id);
                        autoSave(getSaveData({ timezone: id }));
                    }}
                    options={timezoneOptions}
                    placeholder="Seleccionar..."
                    triggerStyle={{ height: "32px", fontSize: fonts.size.sm }}
                />
            </div>

            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Formato de fecha</h3>
                <Dropdown
                    value={dateFormat}
                    onChange={(id) => {
                        setDateFormat(id);
                        autoSave(getSaveData({ date_format: id }));
                    }}
                    options={dateFormatOptions}
                    placeholder="Seleccionar..."
                    triggerStyle={{ height: "32px", fontSize: fonts.size.sm }}
                />
            </div>

            <div style={cardStyle}>
                <h3 style={sectionHeaderStyle}>Tema</h3>
                <Dropdown
                    value={theme}
                    onChange={(id) => {
                        localStorage.setItem("theme", id);
                        autoSave(getSaveData({ theme: id }));
                        setTimeout(() => window.location.reload(), 150);
                    }}
                    options={themeOptions}
                    placeholder="Seleccionar..."
                    triggerStyle={{ height: "32px", fontSize: fonts.size.sm }}
                />
            </div>

            {!isDevEnv && (
                <div style={cardStyle}>
                    <h3 style={sectionHeaderStyle}>Modo de ejecución</h3>
                    <p style={{ fontSize: fonts.size.xs, color: colors.fg.dim, marginBottom: spacing[3] }}>
                        Cambiar esto reiniciará la aplicación.
                    </p>
                    <Dropdown
                        value={daemonMode}
                        onChange={(id) => {
                            if (id === daemonMode) return;
                            setDaemonMode(id);
                            invoke("set_mode", { mode: id }).catch((err) => {
                                toast("Error al cambiar modo: " + String(err));
                            });
                        }}
                        options={[
                            { id: "user", label: "Solo cuando uso la app" },
                            { id: "service", label: "Siempre en segundo plano" },
                        ]}
                        placeholder="Seleccionar..."
                        triggerStyle={{ height: "32px", fontSize: fonts.size.sm }}
                    />
                </div>
            )}
        </div>
    );
}
