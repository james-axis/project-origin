import type { FC, ReactNode } from "react";
import {
    AlertTriangle,
    Announcement01,
    BarChartSquare02,
    CheckDone01,
    CurrencyDollar,
    FileCheck02,
    FileSearch02,
    HomeLine,
    LifeBuoy01,
    Settings01,
    ShieldTick,
    Users01,
} from "@untitledui/icons";

export type NavItemType = {
    /** Label text for the nav item. */
    label: string;
    /** URL to navigate to when the nav item is clicked. */
    href?: string;
    /** Icon component to display. */
    icon?: FC<{ className?: string }>;
    /** Badge to display. */
    badge?: ReactNode;
    /** List of sub-items to display. */
    items?: { label: string; href: string; icon?: FC<{ className?: string }>; badge?: ReactNode }[];
    /** Whether this nav item is a divider. */
    divider?: boolean;
};

export type NavItemDividerType = Omit<NavItemType, "icon" | "label" | "divider"> & {
    /** Label text for the divider. */
    label?: string;
    /** Whether this nav item is a divider. */
    divider: true;
};

export const navItems: (NavItemType & { icon: FC<{ className?: string }> })[] = [
    { label: "Workbench", href: "/", icon: HomeLine },
    { label: "Clients", href: "/clients", icon: Users01 },
    { label: "Tasks", href: "/tasks", icon: CheckDone01 },
    { label: "Applications", href: "/applications", icon: FileCheck02 },
    { label: "Compliance", href: "/compliance", icon: ShieldTick },
    { label: "Claims", href: "/claims", icon: FileSearch02 },
    { label: "Payments", href: "/payments", icon: CurrencyDollar },
    { label: "Dishonours", href: "/dishonours", icon: AlertTriangle },
    { label: "Commissions", href: "/commissions", icon: BarChartSquare02 },
    { label: "Complaints", href: "/complaints", icon: Announcement01 },
    { label: "Reports", href: "/reports", icon: BarChartSquare02 },
];

export const footerNavItems: (NavItemType & { icon: FC<{ className?: string }> })[] = [
    { label: "Support", href: "/support", icon: LifeBuoy01 },
    { label: "Settings", href: "/settings", icon: Settings01 },
];
