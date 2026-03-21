import type { FC, ReactNode } from "react";

export type NavItemType = {
    label: string;
    href?: string;
    icon?: FC<{ className?: string }>;
    badge?: ReactNode;
    items?: { label: string; badge?: number; href: string }[];
};

export type NavItemDividerType = {
    divider: true;
};
import {
    AlertTriangle,
    Announcement01,
    BarChartSquare02,
    CheckDone01,
    CurrencyDollar,
    FileCheck02,
    FileSearch02,
    HomeLine,
    MessageChatCircle,
    Settings01,
    ShieldTick,
    Users01,
} from "@untitledui/icons";

export const navItems: (NavItemType | NavItemDividerType)[] = [
    { label: "Workbench", href: "/", icon: HomeLine as FC<{ className?: string }> },
    { divider: true },
    { label: "Clients", href: "/clients", icon: Users01 as FC<{ className?: string }> },
    { label: "Tasks", href: "/tasks", icon: CheckDone01 as FC<{ className?: string }> },
    { label: "Applications", href: "/applications", icon: FileCheck02 as FC<{ className?: string }> },
    { label: "Compliance", href: "/compliance", icon: ShieldTick as FC<{ className?: string }> },
    { label: "Claims", href: "/claims", icon: FileSearch02 as FC<{ className?: string }> },
    { label: "Payments", href: "/payments", icon: CurrencyDollar as FC<{ className?: string }> },
    { label: "Dishonours", href: "/dishonours", icon: AlertTriangle as FC<{ className?: string }> },
    { label: "Commissions", href: "/commissions", icon: BarChartSquare02 as FC<{ className?: string }> },
    { label: "Complaints", href: "/complaints", icon: Announcement01 as FC<{ className?: string }> },
    { divider: true },
    { label: "Reports", href: "/reports", icon: BarChartSquare02 as FC<{ className?: string }> },
    { label: "Settings", href: "/settings", icon: Settings01 as FC<{ className?: string }> },
    { label: "Support", href: "/support", icon: MessageChatCircle as FC<{ className?: string }> },
];
