import type { FC, ReactNode } from "react";
import {
    AlertCircle,
    Announcement01,
    Flag01,
    BarChartSquare02,
    CheckDone01,
    CurrencyDollar,
    FileCheck02,
    FileSearch02,
    HomeLine,
    LifeBuoy01,
    Settings01,
    Users01,
    UserPlus01,
    Shield01,
    File02,
    FileText01,
    Building01,
    Link01,
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
        label: "Leads",
        href: "/leads",
        icon: UserPlus01,
        items: [
            { label: "All Leads", href: "/leads" },
            { label: "New Leads", href: "/leads/new" },
            { label: "In Progress", href: "/leads/in-progress" },
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
        label: "Insurance",
        href: "/insurance",
        icon: Shield01,
        items: [
            { label: "Products", href: "/insurance" },
            { label: "Policies", href: "/insurance/policies" },
            { label: "Reconciliation", href: "/insurance/reconciliation" },
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
        label: "Campaigns",
        href: "/campaigns",
        icon: Flag01,
        items: [
            { label: "Campaign Groups", href: "/campaigns" },
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
    { 
        label: "Settings", 
        href: "/settings", 
        icon: Settings01,
        items: [
            { label: "Task Builder", href: "/settings?tab=task-builder", icon: CheckDone01 },
            { label: "Users & Access", href: "/settings?tab=users", icon: Users01 },
            { label: "Security", href: "/settings?tab=security", icon: Shield01 },
            { label: "Templates", href: "/settings?tab=templates", icon: File02 },
            { label: "Forms & Data", href: "/settings?tab=forms", icon: FileText01 },
            { label: "Business Config", href: "/settings?tab=business", icon: Building01 },
            { label: "Integrations", href: "/settings?tab=integrations", icon: Link01 },
        ],
    },
];
