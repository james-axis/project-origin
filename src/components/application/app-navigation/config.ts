import type { FC, HTMLAttributes, ReactNode } from "react";

export type NavItemType = {
    label: string;
    href: string;
    icon?: FC<HTMLAttributes<HTMLOrSVGElement>>;
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
    { label: "Workbench", href: "/", icon: HomeLine as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { divider: true },
    { label: "Clients", href: "/clients", icon: Users01 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Tasks", href: "/tasks", icon: CheckDone01 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Applications", href: "/applications", icon: FileCheck02 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Compliance", href: "/compliance", icon: ShieldTick as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Claims", href: "/claims", icon: FileSearch02 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Payments", href: "/payments", icon: CurrencyDollar as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Dishonours", href: "/dishonours", icon: AlertTriangle as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Commissions", href: "/commissions", icon: BarChartSquare02 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Complaints", href: "/complaints", icon: Announcement01 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { divider: true },
    { label: "Reports", href: "/reports", icon: BarChartSquare02 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Settings", href: "/settings", icon: Settings01 as FC<HTMLAttributes<HTMLOrSVGElement>> },
    { label: "Support", href: "/support", icon: MessageChatCircle as FC<HTMLAttributes<HTMLOrSVGElement>> },
];
