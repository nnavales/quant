import { spacing, radius } from "@/styles/theme";
import { colors } from "@/styles/colors";
import { fonts } from "@/styles/fonts";
import { Modal, ModalContent, ModalCloseButton } from "./Modal";
import type { HelpSection } from "@/data/helpContent";
import type { ReactNode } from "react";

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    intro?: ReactNode;
    sections: HelpSection[];
}

export function HelpModal({ isOpen, onClose, title, intro, sections }: HelpModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} opacity={0.4}>
            <ModalContent
                style={{
                    width: "92%",
                    maxWidth: 560,
                    maxHeight: "82vh",
                    backgroundColor: colors.bg.elevated,
                    borderRadius: radius.xl,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: spacing[3],
                        padding: `${spacing[4]} ${spacing[5]}`,
                        borderBottom: `1px solid ${colors.border}`,
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: fonts.size.xs,
                                fontWeight: fonts.weight.semibold,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: colors.fg.dim,
                                marginBottom: 4,
                            }}
                        >
                            Ayuda
                        </div>
                        <h2
                            style={{
                                fontSize: fonts.size.lg,
                                fontWeight: fonts.weight.semibold,
                                color: colors.fg.base,
                                margin: 0,
                            }}
                        >
                            {title}
                        </h2>
                    </div>
                    <ModalCloseButton onClick={onClose} />
                </div>

                {/* Body */}
                <div
                    style={{
                        overflow: "auto",
                        padding: `${spacing[4]} ${spacing[5]} ${spacing[5]}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: spacing[3],
                    }}
                >
                    {intro != null && (
                        <div
                            style={{
                                fontSize: fonts.size.sm,
                                color: colors.fg.base,
                                lineHeight: 1.5,
                                paddingLeft: spacing[3],
                                borderLeft: `2px solid ${colors.accent.cyan}`,
                            }}
                        >
                            {intro}
                        </div>
                    )}

                    {sections.map((s, i) => {
                        const accent = s.accent ?? colors.accent.cyan;
                        const Icon = s.icon;
                        return (
                            <div key={i} style={{ display: "flex", gap: spacing[3] }}>
                                {Icon && (
                                    <div
                                        style={{
                                            flexShrink: 0,
                                            width: 30,
                                            height: 30,
                                            borderRadius: radius.md,
                                            backgroundColor: `${accent}1A`,
                                            color: accent,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Icon size={15} strokeWidth={2.5} />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: fonts.size.sm,
                                            fontWeight: fonts.weight.semibold,
                                            color: colors.fg.base,
                                            marginBottom: 5,
                                            lineHeight: "30px",
                                        }}
                                    >
                                        {s.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: fonts.size.sm,
                                            color: colors.fg.dim,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {s.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 6,
                        padding: `${spacing[2]} ${spacing[5]}`,
                        borderTop: `1px solid ${colors.border}`,
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: fonts.size.xs, color: colors.fg.dim }}>Cerrar con</span>
                    <span
                        style={{
                            display: "inline-block",
                            padding: "0 5px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: colors.fg.base,
                            backgroundColor: colors.fill,
                            borderRadius: "4px",
                            border: `1px solid ${colors.border}`,
                            fontFamily: "monospace",
                            lineHeight: "18px",
                        }}
                    >
                        Esc
                    </span>
                </div>
            </ModalContent>
        </Modal>
    );
}
