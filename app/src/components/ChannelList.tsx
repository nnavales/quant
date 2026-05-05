import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { channels } from "@/api_client";
import type { Channel, ChannelReq } from "@/api_client/types";
import { toast } from "@/utils/toast";
import { getApiErrorMessage } from "@/utils/apiErrors";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { cardStyle, rowStyle } from "@/styles/layout";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";

const inputStyle: React.CSSProperties = {
    height: "28px",
    padding: `0 ${spacing[3]}`,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.fill}`,
    borderRadius: radius.md,
    color: colors.fg.base,
    fontSize: fonts.size.sm,
    outline: "none",
    boxSizing: "border-box",
    flex: 1,
};

export function ChannelList() {
    const [items, setItems] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<ChannelReq>({ name: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        channels
            .list()
            .then(setItems)
            .catch((err: unknown) => toast(getApiErrorMessage(err)))
            .finally(() => setLoading(false));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await channels.create(formData);
            setFormData({ name: "" });
            setShowForm(false);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    const handleDelete = (id: string) => {
        setDeleteConfirm(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await channels.delete(deleteConfirm);
            setDeleteConfirm(null);
            loadData();
        } catch (err: unknown) {
            toast(getApiErrorMessage(err));
        }
    };

    if (loading) return <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[8] }}>Cargando...</div>;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: spacing[4] }}>
                <Button
                    variant="secondary"
                    iconLeft={<Plus size={16} />}
                    onClick={() => setShowForm(!showForm)}
                >
                    Nuevo Canal
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} style={{ ...cardStyle, marginBottom: spacing[4], display: "flex", gap: spacing[2] }}>
                    <input
                        type="text"
                        placeholder="Nombre del canal"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ name: e.target.value })}
                        style={inputStyle}
                    />
                    <Button type="submit" variant="primary">
                        Guardar
                    </Button>
                </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                {items.map((channel) => (
                    <div
                        key={channel.id}
                        style={rowStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.fill; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.bg.base; }}
                    >
                        <span style={{ fontSize: fonts.size.sm, color: colors.fg.base }}>{channel.name}</span>
                        <Button
                            variant="icon"
                            title="Eliminar"
                            onClick={() => handleDelete(channel.id)}
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>
                ))}
                {items.length === 0 && <div style={{ color: colors.fg.dim, textAlign: "center", padding: spacing[4] }}>No hay canales</div>}
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title="Confirmar eliminación"
                description="¿Eliminar este canal?"
            />
        </div>
    );
}
