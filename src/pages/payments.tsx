import { useState } from "react";
import { useLocation, Link } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { ChevronLeft, ChevronRight, Calendar, ArrowDown, ArrowUp, Plus, SearchLg, Download01, Upload01, Edit01, Trash01 } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type PeriodTab = "week" | "month" | "quarter" | "year";
type PayrunTab = "all" | "reconciled" | "unreconciled" | "issues";

interface UserActivity {
  id: number;
  userName: string;
  action: string;
  timestamp: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_USER_ACTIVITY: UserActivity[] = [
  { id: 1, userName: "Aldrine Regido", action: "Parsed NEOS Payrun #2810 (30 transactions saved)", timestamp: "3 days, 3 hours ago" },
  { id: 2, userName: "Aldrine Regido", action: "Created NEOS Payrun #2810", timestamp: "3 days, 3 hours ago" },
  { id: 3, userName: "Aldrine Regido", action: "Parsed MetLife Payrun #2809 (1 transactions saved)", timestamp: "3 days, 3 hours ago" },
  { id: 4, userName: "Aldrine Regido", action: "Created MetLife Payrun #2809", timestamp: "3 days, 3 hours ago" },
  { id: 5, userName: "Aldrine Regido", action: "Parsed Encompass Payrun #2808 (15 transactions saved)", timestamp: "3 days, 3 hours ago" },
  { id: 6, userName: "Aldrine Regido", action: "Created Encompass Payrun #2808", timestamp: "3 days, 3 hours ago" },
  { id: 7, userName: "Aldrine Regido", action: "Parsed ClearView Payrun #2807 (23 transactions saved)", timestamp: "4 days ago" },
  { id: 8, userName: "Aldrine Regido", action: "Created ClearView Payrun #2807", timestamp: "4 days ago" },
  { id: 9, userName: "Stephen Lai", action: "Linked Payrun #2804 to bank transaction #5206", timestamp: "5 days, 20 hours ago" },
  { id: 10, userName: "Stephen Lai", action: "Linked Payrun #2805 to bank transaction #5205", timestamp: "5 days, 20 hours ago" },
];

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({ 
  label, 
  value, 
  count, 
  change, 
  badgeValue,
  badgeColor = "gray"
}: { 
  label: string; 
  value: string; 
  count: string;
  change?: { value: string; direction: "up" | "down" | "none"; };
  badgeValue: string;
  badgeColor?: "green" | "orange" | "red" | "gray";
}) {
  const badgeClasses = {
    green: "bg-success-secondary text-success-primary",
    orange: "bg-warning-secondary text-warning-primary",
    red: "bg-error-secondary text-error-primary",
    gray: "bg-secondary text-tertiary",
  };

  return (
    <div className="bg-primary rounded-xl border border-secondary p-5 flex-1">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-medium text-tertiary uppercase tracking-wide">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[badgeColor]}`}>
          {badgeValue}
        </span>
      </div>
      <p className="text-3xl font-semibold text-primary mb-1">{value}</p>
      <p className="text-sm text-tertiary mb-2">{count}</p>
      {change && (
        <div className={`flex items-center gap-1 text-sm ${change.direction === "down" ? "text-error-primary" : change.direction === "up" ? "text-success-primary" : "text-tertiary"}`}>
          {change.direction === "down" && <ArrowDown className="size-3.5" />}
          {change.direction === "up" && <ArrowUp className="size-3.5" />}
          <span>{change.value}</span>
        </div>
      )}
      {!change && <p className="text-sm text-quaternary">No previous period data</p>}
    </div>
  );
}

// ─── Chart Placeholder Card ───────────────────────────────────────────────────
function ChartCard({ title }: { title: string }) {
  return (
    <div className="bg-primary rounded-xl border border-secondary p-5 flex-1">
      <h3 className="text-base font-semibold text-primary mb-3">{title}</h3>
      <p className="text-sm text-tertiary">No payrun data for this period.</p>
    </div>
  );
}

// ─── List Card Component ──────────────────────────────────────────────────────
function ListCard({ 
  title, 
  tabs,
  activeTab,
  onTabChange,
  emptyMessage
}: { 
  title: string;
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="bg-primary rounded-xl border border-secondary flex-1 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        <div className="flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.id 
                  ? "bg-brand-solid text-white" 
                  : "text-tertiary hover:text-secondary hover:bg-secondary_alt"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex items-start px-5 pb-5">
        <p className="text-sm text-tertiary">{emptyMessage}</p>
      </div>
    </div>
  );
}

// ─── User Activity Card ───────────────────────────────────────────────────────
function UserActivityCard({ activities }: { activities: UserActivity[] }) {
  return (
    <div className="bg-primary rounded-xl border border-secondary flex-1 flex flex-col min-h-[320px]">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-semibold text-primary">User Activity</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="flex flex-col gap-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <svg className="size-4 text-fg-quaternary" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 8a5 5 0 0110 0H3z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary">
                  <span className="font-semibold">{activity.userName}</span>{" "}
                  <span className="text-secondary">{activity.action}</span>
                </p>
                <p className="text-xs text-tertiary mt-0.5">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

// Tab configuration
const PAYMENT_TABS = [
  { id: "dashboard", label: "Dashboard", href: "/payments" },
  { id: "payruns", label: "Payruns", href: "/payments/payruns" },
  { id: "transactions", label: "Bank Transactions", href: "/payments/transactions" },
  { id: "reconciliation", label: "Reconciliation", href: "/payments/reconciliation" },
  { id: "file-formats", label: "Payruns File Formats", href: "/payments/file-formats" },
  { id: "name-formats", label: "Transaction Name Formats", href: "/payments/name-formats" },
];

// Mock Payruns data
const MOCK_PAYRUNS = [
  { id: 2810, insurer: "NEOS", date: "27 Mar 2026", amount: "$12,450.00", transactions: 30, status: "Reconciled", reconciled: "$12,450.00" },
  { id: 2809, insurer: "MetLife", date: "27 Mar 2026", amount: "$3,200.00", transactions: 1, status: "Reconciled", reconciled: "$3,200.00" },
  { id: 2808, insurer: "Encompass", date: "26 Mar 2026", amount: "$8,750.00", transactions: 15, status: "Unreconciled", reconciled: "$5,200.00" },
  { id: 2807, insurer: "ClearView", date: "25 Mar 2026", amount: "$15,800.00", transactions: 23, status: "Reconciled", reconciled: "$15,800.00" },
  { id: 2806, insurer: "TAL", date: "24 Mar 2026", amount: "$22,100.00", transactions: 18, status: "Issues", reconciled: "$18,500.00" },
  { id: 2805, insurer: "Zurich", date: "23 Mar 2026", amount: "$9,650.00", transactions: 12, status: "Reconciled", reconciled: "$9,650.00" },
];

// Mock Bank Transactions data
const MOCK_BANK_TRANSACTIONS = [
  { id: 5210, date: "27 Mar 2026", description: "NEOS Life Insurance - Commission March", amount: "$12,450.00", status: "Matched", payrunId: 2810 },
  { id: 5209, date: "27 Mar 2026", description: "MetLife Aus - Adviser Payment", amount: "$3,200.00", status: "Matched", payrunId: 2809 },
  { id: 5208, date: "26 Mar 2026", description: "Encompass Protection - Q1 Commission", amount: "$8,750.00", status: "Partial", payrunId: 2808 },
  { id: 5207, date: "25 Mar 2026", description: "ClearView Life - Monthly Commission", amount: "$15,800.00", status: "Matched", payrunId: 2807 },
  { id: 5206, date: "24 Mar 2026", description: "TAL Australia - Commission Payment", amount: "$22,100.00", status: "Unmatched", payrunId: null },
  { id: 5205, date: "23 Mar 2026", description: "Zurich Aust - Renewal Commission", amount: "$9,650.00", status: "Matched", payrunId: 2805 },
];

// Mock File Formats data
const MOCK_FILE_FORMATS = [
  { id: 1, name: "NEOS Standard Format", insurer: "NEOS", type: "CSV", lastUpdated: "15 Mar 2026" },
  { id: 2, name: "MetLife Commission Export", insurer: "MetLife", type: "XLSX", lastUpdated: "10 Mar 2026" },
  { id: 3, name: "TAL Payment Report", insurer: "TAL", type: "CSV", lastUpdated: "8 Mar 2026" },
  { id: 4, name: "Zurich Monthly Statement", insurer: "Zurich", type: "PDF", lastUpdated: "1 Mar 2026" },
  { id: 5, name: "ClearView Commission File", insurer: "ClearView", type: "CSV", lastUpdated: "28 Feb 2026" },
];

// Mock Name Formats data
const MOCK_NAME_FORMATS = [
  { id: 1, pattern: "NEOS Life Insurance*", mappedTo: "NEOS", examples: "NEOS Life Insurance - Commission, NEOS Life Insurance Payment" },
  { id: 2, pattern: "MetLife*", mappedTo: "MetLife", examples: "MetLife Aus - Adviser Payment, MetLife Commission" },
  { id: 3, pattern: "TAL*", mappedTo: "TAL", examples: "TAL Australia - Commission Payment, TAL Monthly" },
  { id: 4, pattern: "Zurich*", mappedTo: "Zurich", examples: "Zurich Aust - Renewal Commission, Zurich Life" },
  { id: 5, pattern: "ClearView*", mappedTo: "ClearView", examples: "ClearView Life - Monthly Commission" },
];

// Dashboard Content Component
function DashboardContent() {
  const [period, setPeriod] = useState<PeriodTab>("week");
  const [payrunTab, setPayrunTab] = useState<PayrunTab>("all");
  const [transactionTab, setTransactionTab] = useState<PayrunTab>("all");

  const getDateRange = () => {
    const now = new Date();
    const formatDate = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    if (period === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return `${formatDate(start)} – ${formatDate(now)} ${now.getFullYear()}`;
    }
    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${formatDate(start)} – ${formatDate(now)} ${now.getFullYear()}`;
    }
    if (period === "quarter") {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return `${formatDate(qStart)} – ${formatDate(now)} ${now.getFullYear()}`;
    }
    return `1 Jan – ${formatDate(now)} ${now.getFullYear()}`;
  };

  const listTabs = [
    { id: "all", label: "All" },
    { id: "reconciled", label: "Reconciled" },
    { id: "unreconciled", label: "Unreconciled" },
    { id: "issues", label: "Issues" },
  ];

  return (
    <>
      {/* Period selector header */}
      <div className="flex items-center justify-end gap-3 mb-6">
        <div className="flex rounded-lg border border-secondary bg-primary overflow-hidden">
          {(["week", "month", "quarter", "year"] as PeriodTab[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                period === p ? "bg-brand-solid text-white" : "text-secondary hover:bg-secondary_alt"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-md hover:bg-secondary_alt text-tertiary"><ChevronLeft className="size-4" /></button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary bg-primary">
            <Calendar className="size-4 text-tertiary" />
            <span className="text-sm text-primary whitespace-nowrap">{getDateRange()}</span>
          </div>
          <button className="p-1.5 rounded-md hover:bg-secondary_alt text-tertiary"><ChevronRight className="size-4" /></button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap mb-6">
        <StatCard label="RECONCILED" value="$0.00" count="0 payruns" change={{ value: "-100.0% from previous week", direction: "down" }} badgeValue="0.0%" badgeColor="green" />
        <StatCard label="UNRECONCILED" value="$0.00" count="0 payruns" change={{ value: "-100.0% from previous week", direction: "down" }} badgeValue="0.0%" badgeColor="orange" />
        <StatCard label="ISSUES" value="$0.00" count="0 payruns" badgeValue="0.0%" badgeColor="red" />
      </div>

      {/* Chart cards */}
      <div className="flex gap-4 flex-wrap lg:flex-nowrap mb-6">
        <ChartCard title="Reconciliation Split" />
        <ChartCard title="Amounts by Insurer" />
      </div>

      {/* Lists */}
      <div className="flex gap-4 flex-wrap xl:flex-nowrap">
        <ListCard title="Recent Payruns" tabs={listTabs} activeTab={payrunTab} onTabChange={(t) => setPayrunTab(t as PayrunTab)} emptyMessage="No payruns in this period." />
        <ListCard title="Recent Transactions" tabs={listTabs} activeTab={transactionTab} onTabChange={(t) => setTransactionTab(t as PayrunTab)} emptyMessage="No transactions in this period." />
        <UserActivityCard activities={MOCK_USER_ACTIVITY} />
      </div>
    </>
  );
}

// Payruns Content Component
function PayrunsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredPayruns = MOCK_PAYRUNS.filter(p => {
    if (search && !p.insurer.toLowerCase().includes(search.toLowerCase()) && !String(p.id).includes(search)) return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-primary rounded-xl border border-secondary">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-secondary flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
            <input 
              placeholder="Search payruns..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand w-64"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand">
            <option value="All">All Status</option>
            <option value="Reconciled">Reconciled</option>
            <option value="Unreconciled">Unreconciled</option>
            <option value="Issues">Issues</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary_alt">
            <Upload01 className="size-4" /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover">
            <Plus className="size-4" /> New Payrun
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
              <th className="px-4 py-3">Payrun ID</th>
              <th className="px-4 py-3">Insurer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Transactions</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reconciled</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {filteredPayruns.map(payrun => (
              <tr key={payrun.id} className="hover:bg-secondary_alt">
                <td className="px-4 py-3 text-sm font-medium text-brand-secondary">#{payrun.id}</td>
                <td className="px-4 py-3 text-sm text-primary">{payrun.insurer}</td>
                <td className="px-4 py-3 text-sm text-tertiary">{payrun.date}</td>
                <td className="px-4 py-3 text-sm text-primary font-medium">{payrun.amount}</td>
                <td className="px-4 py-3 text-sm text-tertiary">{payrun.transactions}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-tertiary">{payrun.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-tertiary">{payrun.reconciled}</td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-secondary"><Edit01 className="size-4 text-fg-quaternary" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Bank Transactions Content Component
function BankTransactionsContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredTransactions = MOCK_BANK_TRANSACTIONS.filter(t => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !String(t.id).includes(search)) return false;
    if (statusFilter !== "All" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-primary rounded-xl border border-secondary">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-secondary flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
            <input 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand w-64"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand">
            <option value="All">All Status</option>
            <option value="Matched">Matched</option>
            <option value="Partial">Partial</option>
            <option value="Unmatched">Unmatched</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary_alt">
            <Upload01 className="size-4" /> Import Statement
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Linked Payrun</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {filteredTransactions.map(txn => (
              <tr key={txn.id} className="hover:bg-secondary_alt">
                <td className="px-4 py-3 text-sm font-medium text-brand-secondary">#{txn.id}</td>
                <td className="px-4 py-3 text-sm text-tertiary">{txn.date}</td>
                <td className="px-4 py-3 text-sm text-primary">{txn.description}</td>
                <td className="px-4 py-3 text-sm text-primary font-medium">{txn.amount}</td>
                <td className="px-4 py-3">
                  <span className="text-xs text-tertiary">{txn.status}</span>
                </td>
                <td className="px-4 py-3 text-sm text-brand-secondary">{txn.payrunId ? `#${txn.payrunId}` : "—"}</td>
                <td className="px-4 py-3">
                  <button className="p-1 rounded hover:bg-secondary"><Edit01 className="size-4 text-fg-quaternary" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reconciliation Content Component
function ReconciliationContent() {
  return (
    <div className="space-y-6">
      <div className="bg-primary rounded-xl border border-secondary p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Reconciliation Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-success-secondary">
            <p className="text-sm text-success-primary font-medium">Fully Reconciled</p>
            <p className="text-2xl font-semibold text-success-primary mt-1">24</p>
            <p className="text-sm text-success-primary/70">payruns this month</p>
          </div>
          <div className="p-4 rounded-lg bg-warning-secondary">
            <p className="text-sm text-warning-primary font-medium">Partially Reconciled</p>
            <p className="text-2xl font-semibold text-warning-primary mt-1">8</p>
            <p className="text-sm text-warning-primary/70">payruns pending</p>
          </div>
          <div className="p-4 rounded-lg bg-error-secondary">
            <p className="text-sm text-error-primary font-medium">Unreconciled</p>
            <p className="text-2xl font-semibold text-error-primary mt-1">3</p>
            <p className="text-sm text-error-primary/70">require attention</p>
          </div>
        </div>
      </div>
      <div className="bg-primary rounded-xl border border-secondary p-6">
        <h3 className="text-lg font-semibold text-primary mb-2">Auto-Reconciliation Rules</h3>
        <p className="text-sm text-tertiary mb-4">Configure rules to automatically match bank transactions to payruns.</p>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover">
          <Plus className="size-4" /> Add Rule
        </button>
      </div>
    </div>
  );
}

// File Formats Content Component
function FileFormatsContent() {
  return (
    <div className="bg-primary rounded-xl border border-secondary">
      <div className="flex items-center justify-between p-4 border-b border-secondary">
        <div>
          <h3 className="text-base font-semibold text-primary">Payruns File Formats</h3>
          <p className="text-sm text-tertiary">Configure file formats for importing payruns from different insurers.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover">
          <Plus className="size-4" /> Add Format
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
              <th className="px-4 py-3">Format Name</th>
              <th className="px-4 py-3">Insurer</th>
              <th className="px-4 py-3">File Type</th>
              <th className="px-4 py-3">Last Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {MOCK_FILE_FORMATS.map(format => (
              <tr key={format.id} className="hover:bg-secondary_alt">
                <td className="px-4 py-3 text-sm font-medium text-primary">{format.name}</td>
                <td className="px-4 py-3 text-sm text-tertiary">{format.insurer}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-secondary text-secondary">{format.type}</span></td>
                <td className="px-4 py-3 text-sm text-tertiary">{format.lastUpdated}</td>
                <td className="px-4 py-3 flex gap-1">
                  <button className="p-1 rounded hover:bg-secondary"><Edit01 className="size-4 text-fg-quaternary" /></button>
                  <button className="p-1 rounded hover:bg-secondary"><Trash01 className="size-4 text-fg-quaternary" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Name Formats Content Component
function NameFormatsContent() {
  return (
    <div className="bg-primary rounded-xl border border-secondary">
      <div className="flex items-center justify-between p-4 border-b border-secondary">
        <div>
          <h3 className="text-base font-semibold text-primary">Transaction Name Formats</h3>
          <p className="text-sm text-tertiary">Map bank transaction descriptions to insurers for automatic matching.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover">
          <Plus className="size-4" /> Add Pattern
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
              <th className="px-4 py-3">Pattern</th>
              <th className="px-4 py-3">Maps To</th>
              <th className="px-4 py-3">Example Matches</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {MOCK_NAME_FORMATS.map(format => (
              <tr key={format.id} className="hover:bg-secondary_alt">
                <td className="px-4 py-3 text-sm font-mono text-primary">{format.pattern}</td>
                <td className="px-4 py-3 text-sm font-medium text-brand-secondary">{format.mappedTo}</td>
                <td className="px-4 py-3 text-sm text-tertiary truncate max-w-xs">{format.examples}</td>
                <td className="px-4 py-3 flex gap-1">
                  <button className="p-1 rounded hover:bg-secondary"><Edit01 className="size-4 text-fg-quaternary" /></button>
                  <button className="p-1 rounded hover:bg-secondary"><Trash01 className="size-4 text-fg-quaternary" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PaymentsPage() {
  const location = useLocation();
  
  // Determine active tab based on path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/payments" || path === "/payments/") return "dashboard";
    if (path.includes("/payruns")) return "payruns";
    if (path.includes("/transactions")) return "transactions";
    if (path.includes("/reconciliation")) return "reconciliation";
    if (path.includes("/file-formats")) return "file-formats";
    if (path.includes("/name-formats")) return "name-formats";
    return "dashboard";
  };

  const activeTab = getActiveTab();
  const activeTabData = PAYMENT_TABS.find(t => t.id === activeTab) || PAYMENT_TABS[0];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardContent />;
      case "payruns": return <PayrunsContent />;
      case "transactions": return <BankTransactionsContent />;
      case "reconciliation": return <ReconciliationContent />;
      case "file-formats": return <FileFormatsContent />;
      case "name-formats": return <NameFormatsContent />;
      default: return <DashboardContent />;
    }
  };

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* Header with tabs */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
            Payments
          </h1>
          
          {/* Tab navigation */}
          <div className="flex overflow-x-auto gap-0 -mb-px">
            {PAYMENT_TABS.map(tab => (
              <Link
                key={tab.id}
                to={tab.href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? "border-brand text-brand-secondary" 
                    : "border-transparent text-tertiary hover:text-secondary hover:border-secondary"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
