import {
    ArrowLeftRight,
    Settings,
    Scale,
    LayoutDashboard,
    Target,
    BarChart3,
    LineChart,
    CalendarClock,
} from "lucide-react";
import { colors } from "@/styles/colors";
import { spacing, radius } from "@/styles/theme";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    onOpenSettings: () => void;
}

const navItems = [
    { id: "analysis", icon: LayoutDashboard, label: "Inicio" },
    { id: "transactions", icon: ArrowLeftRight, label: "Transacciones" },
    { id: "evolution", icon: LineChart, label: "Evolución" },
    { id: "metrics", icon: BarChart3, label: "Métricas" },
    { id: "historical", icon: CalendarClock, label: "Histórico" },
    { id: "planning", icon: Target, label: "Planning" },
    { id: "economic", icon: Scale, label: "Económico" },
];

const sidebarStyle: React.CSSProperties = {
    width: "60px",
    height: "100vh",
    position: "sticky",
    top: 0,
    flexShrink: 0,
    backgroundColor: colors.bg.surface,
    display: "flex",
    flexDirection: "column",
    padding: `${spacing[3]} ${spacing[2]}`,
    gap: spacing[2],
};

const iconButtonStyle: React.CSSProperties = {
    width: "44px",
    height: "44px",
    borderRadius: radius.lg,
    border: "none",
    backgroundColor: "transparent",
    color: colors.fg.dim,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s",
};

const iconButtonActiveStyle: React.CSSProperties = {
    ...iconButtonStyle,
    backgroundColor: colors.fill,
    color: colors.fg.base,
};

export function Sidebar({ activeTab, onTabChange, onOpenSettings }: SidebarProps) {
    return (
        <nav style={sidebarStyle}>
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    style={activeTab === item.id ? iconButtonActiveStyle : iconButtonStyle}
                    onMouseEnter={(e) => {
                        if (activeTab !== item.id) {
                            e.currentTarget.style.backgroundColor = colors.fill;
                            e.currentTarget.style.color = colors.fg.base;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (activeTab !== item.id) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = colors.fg.dim;
                        }
                    }}
                >
                    <item.icon size={20} />
                </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
                onClick={onOpenSettings}
                title="Configuración"
                style={iconButtonStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.fill;
                    e.currentTarget.style.color = colors.fg.base;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = colors.fg.dim;
                }}
            >
                <Settings size={20} />
            </button>
        </nav>
    );
}
