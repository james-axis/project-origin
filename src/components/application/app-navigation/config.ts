import {
    BarChartSquare02,
    CheckDone01,
    CurrencyDollar,
    FileCheck02,
    HomeLine,
    Settings01,
    Users01,
    FileSearch02,
    AlertTriangle,
    Announcement01,
    ShieldTick,
    MessageChatCircle,
} from "@untitledui/icons";
import type { ComponentType } from "react";

export type NavItemType = {
    label: string;
    href: string;
    icon?: ComponentType<{ className?: string }>;
    badge?: number | React.ReactNode;
    items?: { label: string; badge?: number; href: string }[];
    divider?: never;
};

export type NavItemDividerType = {
    divider: true;
    label?: never;
    href?: never;
    icon?: never;
    items?: never;
};

export const navItems: (NavItemType | NavItemDividerType)[] = [
    {
        label: "Workbench",
        href: "/",
        icon: HomeLine,
    },
    { divider: true },
    {
        label: "Clients",
        href: "/clients",
        icon: Users01,
    },
    {
        label: "Tasks",
        href: "/tasks",
        icon: CheckDone01,
    },
    {
        label: "Applications",
        href: "/applications",
        icon: FileCheck02,
    },
    {
        label: "Compliance",
        href: "/compliance",
        icon: ShieldTick,
    },
    {
        label: "Claims",
        href: "/claims",
        icon: FileSearch02,
    },
    {
        label: "Payments",
        href: "/payments",
        icon: CurrencyDollar,
    },
    {
        label: "Dishonours",
        href: "/dishonours",
        icon: AlertTriangle,
    },
    {
        label: "Commissions",
        href: "/commissions",
        icon: BarChartSquare02,
    },
    {
        label: "Complaints",
        href: "/complaints",
        icon: Announcement01,
    },
    { divider: true },
    {
        label: "Reports",
        href: "/reports",
        icon: BarChartSquare02,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings01,
    },
    {
        label: "Support",
        href: "/support",
        icon: MessageChatCircle,
    },
];
