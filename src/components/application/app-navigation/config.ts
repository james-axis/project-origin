import type { FC, ReactNode } from "react";
import {
    AlertCircle,
    Announcement01,
    Flag01,
    BarChartSquare02,
    CheckDone01,
    CurrencyDollar,
    Download01,
    FileCheck02,
    FileSearch02,
    Folder,
    HomeLine,
    Settings01,
    Users01,
    UserPlus01,
    Shield01,
    File02,
    File01,
    Building01,
    Link01,
    Phone01,
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
        label: "Tasks",
        href: "/tasks",
        icon: CheckDone01,
        items: [
            { label: "All Tasks", href: "/tasks" },
            { label: "Scheduled Tasks", href: "/tasks?filter=scheduled" },
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
            { label: "Active", href: "/clients?status=active" },
            { label: "Prospects", href: "/clients?status=prospects" },
            { label: "In Progress", href: "/clients?status=in-progress" },
            { label: "Scheduled Appointment", href: "/clients?status=scheduled" },
            { label: "Quote Sent", href: "/clients?status=quote-sent" },
            { label: "Application Pending", href: "/clients?status=application-pending" },
            { label: "Clients", href: "/clients?status=clients" },
            { label: "On Hold", href: "/clients?status=on-hold" },
            { label: "Archive", href: "/clients?status=archive" },
        ],
    },
    {
        label: "Applications",
        href: "/applications",
        icon: FileCheck02,
        items: [
            { label: "Active", href: "/applications" },
            { label: "Closed", href: "/applications/closed" },
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
        label: "Complaints",
        href: "/complaints",
        icon: Announcement01,
        items: [
            { label: "All Complaints", href: "/complaints" },
            { label: "Open", href: "/complaints/open" },
        ],
    },
    {
        label: "Insurance",
        href: "/insurance",
        icon: Shield01,
        items: [
            { label: "Dashboard", href: "/insurance?tab=dashboard" },
            { label: "Active Benefits", href: "/insurance?tab=active" },
            { label: "Inactive Benefits", href: "/insurance?tab=inactive" },
            { label: "Policies", href: "/insurance?tab=policies" },
            { label: "Overdue", href: "/insurance?tab=overdue" },
            { label: "State Report", href: "/insurance?tab=state" },
            { label: "Age Group Report", href: "/insurance?tab=age" },
            { label: "Quotes", href: "/insurance?tab=quotes" },
            { label: "Email Settings", href: "/insurance?tab=email" },
        ],
    },
    {
        label: "Policies",
        href: "/policies",
        icon: File02,
        items: [
            { label: "All Policies", href: "/policies" },
            { label: "Active", href: "/policies?status=active" },
            { label: "Lapsed", href: "/policies?status=lapsed" },
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
        label: "Payments",
        href: "/payments",
        icon: CurrencyDollar,
        items: [
            { label: "Dashboard", href: "/payments" },
            { label: "Payruns", href: "/payments/payruns" },
            { label: "Bank Transactions", href: "/payments/transactions" },
            { label: "Reconciliation", href: "/payments/reconciliation" },
            { label: "Payruns File Formats", href: "/payments/file-formats" },
            { label: "Transaction Name Formats", href: "/payments/name-formats" },
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
            { label: "Leads",             href: "/reports?group=leads" },
            { label: "Activity & Audit",  href: "/reports?group=activity" },
            { label: "Applications",      href: "/reports?group=applications" },
            { label: "Submissions",       href: "/reports?group=submissions" },
            { label: "Completions",       href: "/reports?group=completions" },
        ],
    },
    {
        label: "Exports",
        href: "/exports",
        icon: Download01,
        items: [
            { label: "Clients", href: "/exports?group=clients" },
            { label: "Leads", href: "/exports?group=leads" },
            { label: "Policies", href: "/exports?group=policies" },
            { label: "Commissions", href: "/exports?group=commissions" },
            { label: "Submissions", href: "/exports?group=submissions" },
        ],
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings01,
        items: [
            { label: "Task Builder", href: "/settings?tab=task-builder", icon: CheckDone01 },
            { label: "Users & Access", href: "/settings?tab=users", icon: Users01 },
            { label: "Security", href: "/settings?tab=security", icon: Shield01 },
            { label: "Templates", href: "/settings?tab=templates", icon: File02 },
            { label: "Forms & Data", href: "/settings?tab=forms", icon: File01 },
            { label: "Business Config", href: "/settings?tab=business", icon: Building01 },
            { label: "Integrations", href: "/settings?tab=integrations", icon: Link01 },
        ],
    },
    {
        label: "View Documents",
        href: "/documents",
        icon: Folder,
        items: [
            { label: "Documents", href: "/documents?tab=documents" },
            { label: "Forms",     href: "/documents?tab=forms" },
            { label: "Templates", href: "/documents?tab=templates" },
        ],
    },
    {
        label: "Contacts",
        href: "/contacts",
        icon: Phone01,
        items: [
            { label: "All Contacts", href: "/contacts" },
            { label: "Insurers", href: "/contacts?type=insurers" },
            { label: "Providers", href: "/contacts?type=providers" },
        ],
    },
    {
        label: "Workbench",
        href: "/workbench",
        icon: HomeLine,
        items: [
            { label: "My Workbench", href: "/workbench" },
        ],
    },
];

export const footerNavItems: (NavItemType & { icon: FC<{ className?: string }> })[] = [];
