import { useState, useEffect } from "react";
import { Bot, Send, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import {
    useChatbotConfig,
    useChatbotHealth,
    useSetAgentConfig,
    useSetChatConfig,
} from "@/hooks";
import { SettingsCard } from "@/components/SettingsCard";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { inputStyle, flexColumn } from "@/styles/layout";

const labelStyle: React.CSSProperties = {
    fontSize: fonts.size.xs3,
    fontWeight: fonts.weight.medium,
    color: colors.fg.dim,
};

const hintStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.fg.dim,
    opacity: 0.7,
};

const inputRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
    backgroundColor: colors.bg.surface,
    borderRadius: radius.md,
    paddingRight: spacing[2],
    overflow: "hidden",
};

const fieldStyle: React.CSSProperties = {
    ...inputStyle,
    flex: 1,
    minWidth: 0,
    border: "none",
    backgroundColor: "transparent",
};

const cardTitleStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.semibold,
    color: colors.fg.dim,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
};

const footerStyle: React.CSSProperties = {
    display: "flex",
    gap: spacing[2],
    justifyContent: "flex-end",
    marginTop: spacing[1],
};

interface FieldProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    onSave: () => void;
    onCancel: () => void;
    placeholder?: string;
    hint?: string;
    secret?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

function Field({ label, value, onChange, onSave, onCancel, placeholder, hint, secret, inputMode }: FieldProps) {
    const [reveal, setReveal] = useState(false);

    return (
        <div style={{ ...flexColumn, gap: spacing[1] }}>
            <label style={labelStyle}>{label}</label>
            <div style={inputRowStyle}>
                <input
                    type={secret && !reveal ? "password" : "text"}
                    value={value}
                    inputMode={inputMode}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSave();
                        if (e.key === "Escape") onCancel();
                    }}
                    style={fieldStyle}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                />
                {secret && (
                    <Button
                        variant="icon"
                        type="button"
                        tabIndex={-1}
                        onClick={() => setReveal((s) => !s)}
                        aria-label={reveal ? "Ocultar" : "Mostrar"}
                    >
                        {reveal ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                )}
            </div>
            {hint && <span style={hintStyle}>{hint}</span>}
        </div>
    );
}

function StatusBadge({ ok }: { ok: boolean }) {
    const color = ok ? colors.accent.green : colors.fg.dim;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: spacing[1],
                fontSize: fonts.size.xs3,
                fontWeight: fonts.weight.medium,
                color,
            }}
        >
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: color,
                    boxShadow: ok ? `0 0 6px ${color}` : "none",
                }}
            />
            {ok ? "Activo" : "Sin configurar"}
        </span>
    );
}

function SectionHeader({
    icon,
    title,
    ok,
    showStatus,
}: {
    icon: React.ReactNode;
    title: string;
    ok: boolean;
    showStatus: boolean;
}) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing[3],
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: spacing[2] }}>
                <span style={{ color: colors.fg.dim, display: "inline-flex" }}>{icon}</span>
                <span style={cardTitleStyle}>{title}</span>
            </div>
            {showStatus && <StatusBadge ok={ok} />}
        </div>
    );
}

export function ChatbotSettings() {
    const { data: cfg, isLoading } = useChatbotConfig();
    const { data: health, isLoading: healthLoading } = useChatbotHealth();
    const setAgent = useSetAgentConfig();
    const setChat = useSetChatConfig();

    const [apiKey, setApiKey] = useState("");
    const [modelId, setModelId] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [telegramId, setTelegramId] = useState("");
    const [telegramToken, setTelegramToken] = useState("");

    useEffect(() => {
        if (cfg) {
            setApiKey(cfg.api_key ?? "");
            setModelId(cfg.model_id ?? "");
            setBaseUrl(cfg.base_url ?? "");
            setTelegramId(cfg.telegram_id ? String(cfg.telegram_id) : "");
            setTelegramToken(cfg.telegram_token ?? "");
        }
    }, [cfg]);

    const isAgentDirty =
        apiKey !== (cfg?.api_key ?? "") ||
        modelId !== (cfg?.model_id ?? "") ||
        baseUrl !== (cfg?.base_url ?? "");

    const isChatDirty =
        telegramId !== (cfg?.telegram_id ? String(cfg.telegram_id) : "") ||
        telegramToken !== (cfg?.telegram_token ?? "");

    const agentValid = apiKey.trim() !== "" && modelId.trim() !== "" && baseUrl.trim() !== "";
    const chatValid = telegramToken.trim() !== "" && /^\d+$/.test(telegramId.trim());

    const saveAgent = () => {
        if (!agentValid) return;
        setAgent.mutate(
            { api_key: apiKey.trim(), model_id: modelId.trim(), base_url: baseUrl.trim() },
            {
                onSuccess: () => toast("Configuración del agente guardada", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const cancelAgent = () => {
        setApiKey(cfg?.api_key ?? "");
        setModelId(cfg?.model_id ?? "");
        setBaseUrl(cfg?.base_url ?? "");
    };

    const saveChat = () => {
        if (!chatValid) return;
        setChat.mutate(
            { telegram_id: parseInt(telegramId) || 0, telegram_token: telegramToken.trim() },
            {
                onSuccess: () => toast("Configuración de chat guardada", "success"),
                onError: (err) => toast(getApiErrorMessage(err)),
            }
        );
    };

    const cancelChat = () => {
        setTelegramId(cfg?.telegram_id ? String(cfg.telegram_id) : "");
        setTelegramToken(cfg?.telegram_token ?? "");
    };

    if (isLoading) {
        return (
            <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>
                Cargando...
            </div>
        );
    }

    const showStatus = !healthLoading && !!health;
    const allOk = !!health?.ok;

    return (
        <div style={{ ...flexColumn, gap: spacing[4] }}>
            {showStatus && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing[2],
                        padding: `${spacing[2]} ${spacing[3]}`,
                        borderRadius: radius.lg,
                        fontSize: fonts.size.sm,
                        fontWeight: fonts.weight.medium,
                        color: allOk ? colors.accent.green : colors.fg.dim,
                        backgroundColor: allOk ? `${colors.accent.green}1a` : colors.bg.surface,
                    }}
                >
                    {allOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>
                        {allOk
                            ? "Bot activo — escribile a tu bot por Telegram"
                            : "Completá el agente y Telegram para activar el bot"}
                    </span>
                </div>
            )}

            <SettingsCard>
                <SectionHeader
                    icon={<Bot size={15} />}
                    title="Agente IA"
                    ok={!!health?.agent}
                    showStatus={showStatus}
                />
                <div style={{ ...flexColumn, gap: spacing[3] }}>
                    <Field
                        label="API Key"
                        value={apiKey}
                        onChange={setApiKey}
                        onSave={saveAgent}
                        onCancel={cancelAgent}
                        placeholder="sk-..."
                        hint="API key del proveedor (OpenAI, OpenRouter, etc.)"
                        secret
                    />
                    <Field
                        label="Model ID"
                        value={modelId}
                        onChange={setModelId}
                        onSave={saveAgent}
                        onCancel={cancelAgent}
                        placeholder="openai/gpt-4o"
                        hint="ej: openai/gpt-4o · deepseek/deepseek-v3.2"
                    />
                    <Field
                        label="Base URL"
                        value={baseUrl}
                        onChange={setBaseUrl}
                        onSave={saveAgent}
                        onCancel={cancelAgent}
                        placeholder="https://openrouter.ai/api/v1"
                        hint="Endpoint OpenAI-compatible del proveedor"
                    />
                    {isAgentDirty && (
                        <div style={footerStyle}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={cancelAgent}
                                disabled={setAgent.isPending}
                            >
                                Cancelar
                            </Button>
                            <SubmitButton
                                size="sm"
                                onClick={saveAgent}
                                loading={setAgent.isPending}
                                disabled={!agentValid}
                            >
                                Guardar
                            </SubmitButton>
                        </div>
                    )}
                </div>
            </SettingsCard>

            <SettingsCard>
                <SectionHeader
                    icon={<Send size={15} />}
                    title="Telegram"
                    ok={!!health?.telegram}
                    showStatus={showStatus}
                />
                <div style={{ ...flexColumn, gap: spacing[3] }}>
                    <Field
                        label="Chat ID"
                        value={telegramId}
                        onChange={setTelegramId}
                        onSave={saveChat}
                        onCancel={cancelChat}
                        placeholder="123456789"
                        hint="Tu chat id numérico (no el @usuario). Conseguilo con @userinfobot"
                        inputMode="numeric"
                    />
                    <Field
                        label="Bot Token"
                        value={telegramToken}
                        onChange={setTelegramToken}
                        onSave={saveChat}
                        onCancel={cancelChat}
                        placeholder="123456:ABC-..."
                        hint="Token del bot que te da @BotFather. Al guardar te envía un mensaje de prueba"
                        secret
                    />
                    {isChatDirty && (
                        <div style={footerStyle}>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={cancelChat}
                                disabled={setChat.isPending}
                            >
                                Cancelar
                            </Button>
                            <SubmitButton
                                size="sm"
                                onClick={saveChat}
                                loading={setChat.isPending}
                                disabled={!chatValid}
                            >
                                Guardar
                            </SubmitButton>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
}
