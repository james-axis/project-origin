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
import type { NavItemDividerType, NavItemType } from "./config";

export type { NavItemType, NavItemDividerType };

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
