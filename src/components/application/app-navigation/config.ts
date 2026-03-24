import type { FC, ReactNode } from "react";
import {
    AlertCircle,
    Announcement01,
    Megaphone01,
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
    {
        label: "Workbench",
        href: "/workbench",
        icon: HomeLine,
        items: [
            { label: "My Workbench", href: "/workbench" },
        ],
    },
    {
        label: "Clients",
        href: "/clients",
        icon: Users01,
        items: [
            { label: "All Clients", href: "/clients" },
            { label: "Add Client", href: "/clients/new" },
        ],
    },
    {
        label: "Tasks",
        href: "/tasks",
        icon: CheckDone01,
        items: [
            { label: "All Tasks", href: "/tasks" },
            { label: "Overdue", href: "/tasks/overdue" },
            { label: "Due Today", href: "/tasks/today" },
        ],
    },
    {
        label: "Applications",
        href: "/applications",
        icon: FileCheck02,
        items: [
            { label: "All Applications", href: "/applications" },
            { label: "In Progress", href: "/applications/in-progress" },
            { label: "Submitted", href: "/applications/submitted" },
            { label: "Approved", href: "/applications/approved" },
        ],
    },
    {
        label: "Compliance",
        href: "/compliance",
        icon: ShieldTick,
        items: [
            { label: "All Items", href: "/compliance" },
            { label: "Awaiting Review", href: "/compliance/pending" },
            { label: "Completed", href: "/compliance/completed" },
        ],
    },
    {
        label: "Claims",
        href: "/claims",
        icon: FileSearch02,
        items: [
            { label: "All Claims", href: "/claims" },
            { label: "Open", href: "/claims/open" },
            { label: "Closed", href: "/claims/closed" },
        ],
    },
    {
        label: "Dishonours",
        href: "/dishonours",
        icon: AlertCircle,
        items: [
            { label: "Active", href: "/dishonours" },
            { label: "Closed", href: "/dishonours/closed" },
        ],
    },
    {
        label: "Payments",
        href: "/payments",
        icon: CurrencyDollar,
        items: [
            { label: "All Payments", href: "/payments" },
        ],
    },
    {
        label: "Commissions",
        href: "/commissions",
        icon: BarChartSquare02,
        items: [
            { label: "Overview", href: "/commissions" },
            { label: "This Month", href: "/commissions/current" },
        ],
    },
    {
        label: "Complaints",
        href: "/complaints",
        icon: Announcement01,
        items: [
            { label: "All Complaints", href: "/complaints" },
            { label: "Open", href: "/complaints/open" },
        ],
    },
    {
        label: "Reports",
        href: "/reports",
        icon: BarChartSquare02,
        items: [
            { label: "All Reports", href: "/reports" },
            { label: "Submissions", href: "/reports/submissions" },
        ],
    },
];

export const footerNavItems: (NavItemType & { icon: FC<{ className?: string }> })[] = [
    { label: "Support", href: "/support", icon: LifeBuoy01 },
    { label: "Settings", href: "/settings", icon: Settings01 },
];
