import React, { useState, useRef, useEffect } from "react";
import type { TransactionRowDTO } from "@/api_client";
import type { TransactionAggregateReq } from "@/api_client/types";
import { Check, X, Pencil, CreditCard, ChevronDown, RefreshCw } from "lucide-react";
import { colors } from "@/styles/colors";
import { radius, spacing, shadows } from "@/styles/theme";
import { fonts } from "@/styles/fonts";
import { useUpdateTransaction, useCategories, useSubcategories, useChannels, useAccounts, useUserConfig, useUpdateEntryPaid } from "@/hooks";
import { economic } from "@/api_client";

interface TransactionRowProps {
    transaction: TransactionRowDTO;
    onDelete?: (transaction: TransactionRowDTO) => void;
}

const trStyle: React.CSSProperties = {
    borderBottom: `1px solid ${colors.highlight.low}`,
    transition: "background-color 0.15s",
};

const tdStyle: React.CSSProperties = {
    padding: `${spacing[2]} ${spacing[3]}`,
    verticalAlign: "middle",
};

const getActionBtnStyle = (isDelete: boolean = false, isHover: boolean = false): React.CSSProperties => {
    const base: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        borderRadius: radius.md,
        cursor: "pointer",
        fontSize: fonts.size.sm,
        backgroundColor: "transparent",
    };
    if (isHover) {
        base.border = isDelete ? `1px solid ${colors.accent.red}` : `1px solid ${colors.accent.light_gray}`;
    } else {
        base.border = `1px solid ${colors.highlight.border}`;
    }
    base.color = isDelete ? colors.accent.red : colors.fg.muted;
    return base;
};

const fixedWidthStyle = (width: string): React.CSSProperties => ({ width, minWidth: width, maxWidth: width });

const subStyle: React.CSSProperties = { fontSize: fonts.size.xs, color: colors.fg.muted };

const badgeStyle: React.CSSProperties = {
    fontSize: fonts.size.xs,
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radius.md,
    textTransform: "uppercase",
    fontWeight: 500,
};

const currencyBadgeStyle = (currency: string): React.CSSProperties => ({
    ...badgeStyle,
    backgroundColor: currency === "ARS" ? `${colors.accent.cyan}26` : `${colors.accent.green}26`,
    color: currency === "ARS" ? colors.accent.cyan : colors.accent.green,
});

const formatCurrency = (amount: number) => {
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(amount);
};

type DateFormat = "default" | "full";

const formatDate = (dateStr: string, format: DateFormat) => {
    const date = new Date(dateStr);
    
    if (format === "default") {
        return dateStr;
    }
    
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date).replace(/\s+de\s+/gi, " ");
};

const getNextFormat = (current: DateFormat): DateFormat => {
    if (current === "default") return "full";
    return "default";
};

const STORAGE_KEY = "summit-date-format";

const getStoredFormat = (): DateFormat => {
    try {
        return (localStorage.getItem(STORAGE_KEY) as DateFormat) || "default";
    } catch {
        return "default";
    }
};

const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "2px",
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    padding: spacing[2],
    minWidth: "250px",
    maxHeight: "400px",
    overflowY: "auto",
    zIndex: 60,
    boxShadow: shadows.lg,
};

const dropdownItemStyle: React.CSSProperties = {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: radius.sm,
    fontSize: "var(--font-size-sm)",
    color: colors.fg.default,
    whiteSpace: "normal",
    wordBreak: "break-word",
};

const formInputStyle: React.CSSProperties = {
    width: "100%",
    height: "28px",
    padding: "4px 6px",
    backgroundColor: colors.bg.dim,
    border: `1px solid ${colors.highlight.medium}`,
    borderRadius: radius.md,
    color: colors.fg.default,
    fontSize: "var(--font-size-sm)",
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
    MozAppearance: "textfield",
};

const formSelectStyle: React.CSSProperties = {
    ...formInputStyle,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
    const [show, setShow] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const checkedRef = useRef(false);
    const textRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        setPos({ x: e.clientX + 10, y: e.clientY + 10 });
    };

    const handleMouseEnter = () => {
        if (!checkedRef.current && textRef.current) {
            const el = textRef.current;
            checkedRef.current = el.scrollWidth > el.clientWidth;
        }
        if (checkedRef.current) {
            setShow(true);
        }
    };

    return (
        <span onMouseEnter={handleMouseEnter} onMouseLeave={() => setShow(false)} onMouseMove={handleMouseMove}>
            {React.isValidElement(children) 
                ? React.cloneElement(children as React.ReactElement<{ref?: React.Ref<HTMLSpanElement>}>, { ref: textRef })
                : children
            }
            {show && content && (
                <div style={{ position: "fixed", left: pos.x, top: pos.y, backgroundColor: colors.bg.surface, border: `1px solid ${colors.highlight.medium}`, borderRadius: radius.md, padding: `${spacing[1]} ${spacing[2]}`, fontSize: fonts.size.xs, color: colors.fg.default, boxShadow: shadows.base, zIndex: 1000, whiteSpace: "nowrap", pointerEvents: "none" }}>
                    {content}
                </div>
            )}
        </span>
    );
}

export function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [hoverDelete, setHoverDelete] = useState(false);
    const [dateFormat, setDateFormat] = useState<DateFormat>(() => getStoredFormat());

    const handleFormatClick = () => {
        const next = getNextFormat(dateFormat);
        setDateFormat(next);
        localStorage.setItem(STORAGE_KEY, next);
        window.dispatchEvent(new Event("date-format-changed"));
    };

    const [formData, setFormData] = useState<TransactionAggregateReq>({
        description: transaction.description || "",
        date: transaction.date,
        type: transaction.type as "expense" | "income",
        frequency: transaction.frequency as "fixed" | "variable",
        installment_number: transaction.installment_number ?? undefined,
        amount: transaction.amount,
        currency: transaction.currency as "ARS" | "USD",
        exchange_rate: transaction.exchange_rate,
        category_id: transaction.category_id || "",
        subcategory_id: transaction.subcategory_id || "",
        channel_id: transaction.channel_id || "",
        account_id: transaction.account_id || "",
    });

    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = getStoredFormat();
        if (stored !== dateFormat) {
            setDateFormat(stored);
        }
    }, []);

    useEffect(() => {
        const handleFormatChange = () => {
            setDateFormat(getStoredFormat());
        };
        window.addEventListener("date-format-changed", handleFormatChange);
        return () => window.removeEventListener("date-format-changed", handleFormatChange);
    }, []);

    const updateMutation = useUpdateTransaction();
    const updatePaidMutation = useUpdateEntryPaid();
    const { data: categoriesData } = useCategories();
    const { data: subcategoriesData } = useSubcategories();
    const { data: channelsData } = useChannels();
    const { data: accountsData } = useAccounts();
    const { data: userConfig } = useUserConfig();

    const categoriesList = categoriesData ?? [];
    const subcategoriesList = subcategoriesData ?? [];
    const channelsList = channelsData ?? [];
    const accountsList = accountsData ?? [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (containerRef.current && !containerRef.current.contains(target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditing) {
            setFormData({
                description: transaction.description || "",
                date: transaction.date,
                type: transaction.type as "expense" | "income",
                frequency: transaction.frequency as "fixed" | "variable",
                installment_number: transaction.installment_number ?? undefined,
                amount: transaction.amount,
                currency: transaction.currency as "ARS" | "USD",
                exchange_rate: transaction.exchange_rate,
                category_id: transaction.category_id || "",
                subcategory_id: transaction.subcategory_id || "",
                channel_id: transaction.channel_id || "",
                account_id: transaction.account_id || "",
            });
        }
    }, [isEditing, transaction]);

    const toggleDropdown = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenDropdown((prev) => (prev === name ? null : name));
    };

    const categoryGroups = categoriesList
        .map((cat) => ({
            label: cat.name,
            items: subcategoriesList.filter((s) => s.category_id === cat.id).map((s) => ({ id: s.id, name: s.name })),
        }))
        .filter((g) => g.items.length > 0);

    const accountGroups = channelsList
        .map((ch) => ({
            label: ch.name,
            items: accountsList.filter((a) => a.channel_id === ch.id).map((a) => ({ id: a.id, name: a.name })),
        }))
        .filter((g) => g.items.length > 0);

    const handleCategorySelect = (subId: string) => {
        const sub = subcategoriesList.find((s) => s.id === subId);
        setFormData({ ...formData, subcategory_id: subId, category_id: sub?.category_id || "" });
        setOpenDropdown(null);
    };

    const handleAccountSelect = (accId: string) => {
        const acc = accountsList.find((a) => a.id === accId);
        setFormData({ ...formData, account_id: accId, channel_id: acc?.channel_id || "" });
        setOpenDropdown(null);
    };

    const handleDelete = () => onDelete?.(transaction);
    const handleEdit = () => setIsEditing(true);
    const handleSave = () => {
        updateMutation.mutate({ id: transaction.id, data: formData }, { onSuccess: () => setIsEditing(false) });
    };
    const handleCancel = () => setIsEditing(false);

    const handleTogglePaid = () => {
        updatePaidMutation.mutate({ id: transaction.entry_id, isPaid: !transaction.is_paid });
    };

    const getDisplayValue = (type: "category" | "account") => {
        if (type === "category" && formData.subcategory_id) {
            return subcategoriesList.find((s) => s.id === formData.subcategory_id)?.name || "";
        }
        if (type === "account" && formData.account_id) {
            return accountsList.find((a) => a.id === formData.account_id)?.name || "";
        }
        return "-";
    };

    const isExpense = transaction.type === "expense";
    const amount = parseFloat(transaction.amount);
    const alternateAmount = transaction.currency === "ARS" ? amount / transaction.exchange_rate : amount * transaction.exchange_rate;

    if (isEditing) {
        return (
            <tr style={{ ...trStyle, backgroundColor: colors.bg.dim }}>
                <td style={{ ...tdStyle, ...fixedWidthStyle("100px") }}>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={formInputStyle} required />
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("250px") }}>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" style={formInputStyle} required />
                    <div style={{ ...subStyle, marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="text" inputMode="numeric" value={formData.installment_number ?? ""} placeholder={transaction.total_installments ? String(transaction.total_installments) : "1"} onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, installment_number: val ? parseInt(val) : undefined });
                        }} style={{ ...formInputStyle, width: "50px", height: "22px", fontSize: "11px", padding: "2px 4px" }} />
                        <span>Cuotas</span>
                    </div>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("80px") }}>
                    <div style={{ position: "relative" }}>
                        <button type="button" data-dropdown-btn onMouseDown={(e) => toggleDropdown("type", e)} style={{ ...formSelectStyle, width: "100%", height: "28px" }}>
                            <span>{formData.type === "expense" ? "Egreso" : "Ingreso"}</span>
                            <ChevronDown size={12} />
                        </button>
                        {openDropdown === "type" && (
                            <div style={{ ...dropdownStyle, width: "100%", minWidth: "80px" }}>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.type === "expense" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, type: "expense" }); setOpenDropdown(null); }}>Egreso</div>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.type === "income" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, type: "income" }); setOpenDropdown(null); }}>Ingreso</div>
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                    <div style={{ position: "relative" }}>
                        <button type="button" data-dropdown-btn onMouseDown={(e) => toggleDropdown("freq", e)} style={{ ...formSelectStyle, width: "100%", height: "28px" }}>
                            <span>{formData.frequency === "fixed" ? "Fijo" : formData.frequency === "variable" ? "Var" : "-"}</span>
                            <ChevronDown size={12} />
                        </button>
                        {openDropdown === "freq" && (
                            <div style={{ ...dropdownStyle, width: "100%", minWidth: "60px" }}>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.frequency === "fixed" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, frequency: "fixed" }); setOpenDropdown(null); }}>Fijo</div>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.frequency === "variable" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, frequency: "variable" }); setOpenDropdown(null); }}>Var</div>
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("120px") }}>
                    <div style={{ position: "relative" }} ref={containerRef}>
                        <button type="button" data-dropdown-btn onMouseDown={(e) => toggleDropdown("category", e)} style={{ ...formSelectStyle, width: "100%", height: "28px" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDisplayValue("category")}</span>
                            <ChevronDown size={12} />
                        </button>
                        {openDropdown === "category" && (
                            <div style={{ ...dropdownStyle, width: "180px" }}>
                                {categoryGroups.map((group) => (
                                    <div key={group.label}>
                                        <div style={{ ...dropdownItemStyle, fontWeight: 600, color: colors.fg.muted, cursor: "default" }}>{group.label}</div>
                                        {group.items.map((item) => (
                                            <div key={item.id} style={{ ...dropdownItemStyle, paddingLeft: "16px", backgroundColor: formData.subcategory_id === item.id ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); handleCategorySelect(item.id); }}>{item.name}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("100px") }}>
                    <div style={{ position: "relative" }}>
                        <button type="button" data-dropdown-btn onMouseDown={(e) => toggleDropdown("account", e)} style={{ ...formSelectStyle, width: "100%", height: "28px" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDisplayValue("account")}</span>
                            <ChevronDown size={12} />
                        </button>
                        {openDropdown === "account" && (
                            <div style={{ ...dropdownStyle, width: "180px" }}>
                                {accountGroups.map((group) => (
                                    <div key={group.label}>
                                        <div style={{ ...dropdownItemStyle, fontWeight: 600, color: colors.fg.muted, cursor: "default" }}>{group.label}</div>
                                        {group.items.map((item) => (
                                            <div key={item.id} style={{ ...dropdownItemStyle, paddingLeft: "16px", backgroundColor: formData.account_id === item.id ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); handleAccountSelect(item.id); }}>{item.name}</div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("60px") }}>
                    <div style={{ position: "relative" }}>
                        <button type="button" data-dropdown-btn onMouseDown={(e) => toggleDropdown("currency", e)} style={{ ...formSelectStyle, width: "100%", height: "28px", justifyContent: "center" }}>
                            <span>{formData.currency}</span>
                            <ChevronDown size={12} />
                        </button>
                        {openDropdown === "currency" && (
                            <div style={{ ...dropdownStyle, width: "100%", minWidth: "60px" }}>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.currency === "ARS" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, currency: "ARS" }); setOpenDropdown(null); }}>ARS</div>
                                <div style={{ ...dropdownItemStyle, backgroundColor: formData.currency === "USD" ? colors.highlight.low : "transparent" }} onMouseDown={(e) => { e.stopPropagation(); setFormData({ ...formData, currency: "USD" }); setOpenDropdown(null); }}>USD</div>
                            </div>
                        )}
                    </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", paddingRight: spacing[3], ...fixedWidthStyle("140px") }}>
                    <input type="text" inputMode="decimal" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} style={{ ...formInputStyle, textAlign: "right", fontFamily: fonts.family.mono, fontWeight: 600 }} required />
                </td>
                <td style={{ ...tdStyle, textAlign: "right", ...fixedWidthStyle("100px") }}>
                    <div style={{ position: "relative" }}>
                        <input type="text" inputMode="decimal" value={formData.exchange_rate} onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) || 1 })} style={{ ...formInputStyle, textAlign: "right", fontFamily: fonts.family.mono, paddingRight: "28px" }} />
                        <button
                            type="button"
                            onClick={async () => {
                                const banks = await economic.getDollarBanks(undefined, true);
                                if (userConfig?.dollar_source && banks) {
                                    const bankValue = banks[userConfig.dollar_source];
                                    if (bankValue) {
                                        setFormData((prev) => ({ ...prev, exchange_rate: bankValue.sell }));
                                    }
                                }
                            }}
                            title="Actualizar TC"
                            style={{
                                position: "absolute",
                                right: "4px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "24px",
                                height: "24px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "transparent",
                                border: "none",
                                color: colors.fg.muted,
                                cursor: "pointer",
                            }}
                        >
                            <RefreshCw size={12} />
                        </button>
                    </div>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap", width: "130px" }}>
                    <span style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
                        <button onClick={handleSave} disabled={updateMutation.isPending} style={{ ...getActionBtnStyle(false, false), backgroundColor: colors.accent.teal, color: colors.bg.default, border: "none" }} title="Guardar">
                            {updateMutation.isPending ? "..." : <Check size={14} />}
                        </button>
                        <button onClick={handleCancel} style={{ ...getActionBtnStyle(false, false) }} title="Cancelar">
                            <X size={14} />
                        </button>
                    </span>
                </td>
            </tr>
        );
    }

    return (
        <>
            <tr style={trStyle} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.highlight.low)} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), cursor: "pointer" }} onClick={handleFormatClick} title="Cambiar formato">{formatDate(transaction.date, dateFormat)}</td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("250px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.description || "Sin descripción"}>
                        <span style={{ fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {transaction.description || "Sin descripción"}
                        </span>
                    </Tooltip>
                    {transaction.installment_number && <div style={subStyle}>Cuota {transaction.installment_number}/{transaction.total_installments}</div>}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("80px") }}>
                    <span style={{ ...badgeStyle, backgroundColor: isExpense ? `${colors.semantic.error}26` : `${colors.semantic.success}26`, color: isExpense ? colors.semantic.error : colors.semantic.success }}>
                        {transaction.type === "expense" ? "Egreso" : "Ingreso"}
                    </span>
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("60px") }}>
                    {transaction.frequency === "fixed" ? (
                        <span style={{ ...badgeStyle, backgroundColor: `${colors.accent.teal}26`, color: colors.accent.teal }}>Fijo</span>
                    ) : transaction.frequency === "variable" ? (
                        <span style={{ ...badgeStyle, backgroundColor: `${colors.fg.muted}26`, color: colors.fg.muted }}>Var</span>
                    ) : (
                        <span style={{ color: colors.fg.muted }}>-</span>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("120px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.category_name || "-"}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {transaction.category_name || "-"}
                        </span>
                    </Tooltip>
                    {transaction.subcategory_name && (
                        <Tooltip content={transaction.subcategory_name}>
                            <div style={{ ...subStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {transaction.subcategory_name}
                            </div>
                        </Tooltip>
                    )}
                </td>
                <td style={{ ...tdStyle, ...fixedWidthStyle("100px"), overflow: "hidden" }}>
                    <Tooltip content={transaction.channel_name}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {transaction.channel_name}
                        </span>
                    </Tooltip>
                    {transaction.account_name && (
                        <Tooltip content={transaction.account_name}>
                            <div style={{ ...subStyle, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {transaction.account_name}
                            </div>
                        </Tooltip>
                    )}
                </td>
                <td style={{ ...tdStyle, textAlign: "center", ...fixedWidthStyle("60px") }}>
                    <span style={currencyBadgeStyle(transaction.currency)}>{transaction.currency}</span>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", paddingRight: spacing[3], ...fixedWidthStyle("140px") }}>
                    <Tooltip content={`${transaction.currency} ${formatCurrency(amount)}`}>
                        <span style={{ fontFamily: fonts.family.mono, fontWeight: 600, fontSize: fonts.size.sm, color: colors.fg.default, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {transaction.currency} {formatCurrency(amount)}
                        </span>
                    </Tooltip>
                    <Tooltip content={`${transaction.currency === "ARS" ? "USD" : "ARS"} ${formatCurrency(alternateAmount)}`}>
                        <span style={{ fontFamily: fonts.family.mono, fontSize: fonts.size.xs, color: colors.fg.muted, display: "block", opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {transaction.currency === "ARS" ? "USD" : "ARS"} {formatCurrency(alternateAmount)}
                        </span>
                    </Tooltip>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", fontFamily: fonts.family.mono, fontSize: fonts.size.xs, color: colors.fg.muted, opacity: 0.7, ...fixedWidthStyle("100px") }}>
                    <Tooltip content={transaction.exchange_rate % 1 === 0 ? String(transaction.exchange_rate) : transaction.exchange_rate.toFixed(2)}>
                        <span>{transaction.exchange_rate % 1 === 0 ? transaction.exchange_rate.toString() : transaction.exchange_rate.toFixed(2)}</span>
                    </Tooltip>
                </td>
                <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap", width: "130px" }}>
                    <span style={{ display: "flex", gap: spacing[2], justifyContent: "flex-end" }}>
                        {transaction.installment_number && (
                            <button style={getActionBtnStyle(false, false)} title="Cancelar cuotas"><CreditCard size={14} /></button>
                        )}
                        <button 
                            onClick={handleTogglePaid}
                            style={transaction.is_paid ? { ...getActionBtnStyle(false, false), backgroundColor: colors.accent.teal, color: colors.bg.default, border: "none" } : getActionBtnStyle(false, false)}
                            title={transaction.is_paid ? "Desmarcar como pagado" : "Marcar como pagado"}
                        >
                            <Check size={14} />
                        </button>
                        <button style={getActionBtnStyle(false, false)} onClick={handleEdit} title="Editar"><Pencil size={14} /></button>
                        <button style={getActionBtnStyle(true, hoverDelete)} onMouseEnter={() => setHoverDelete(true)} onMouseLeave={() => setHoverDelete(false)} onClick={handleDelete} title="Eliminar"><X size={14} /></button>
                    </span>
                </td>
            </tr>
        </>
    );
}
