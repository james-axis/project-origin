import { useState } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { ChevronLeft, ChevronRight, Calendar, ArrowDown, ArrowUp } from "@untitledui/icons";

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
export function PaymentsPage() {
  const [period, setPeriod] = useState<PeriodTab>("week");
  const [payrunTab, setPayrunTab] = useState<PayrunTab>("all");
  const [transactionTab, setTransactionTab] = useState<PayrunTab>("all");

  // Calculate date range based on period
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
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
              Payments Dashboard
            </h1>
            
            <div className="flex items-center gap-3">
              {/* Period tabs */}
              <div className="flex rounded-lg border border-secondary bg-primary overflow-hidden">
                {(["week", "month", "quarter", "year"] as PeriodTab[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      period === p 
                        ? "bg-brand-solid text-white" 
                        : "text-secondary hover:bg-secondary_alt"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Date range picker */}
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md hover:bg-secondary_alt text-tertiary">
                  <ChevronLeft className="size-4" />
                </button>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary bg-primary">
                  <Calendar className="size-4 text-tertiary" />
                  <span className="text-sm text-primary whitespace-nowrap">{getDateRange()}</span>
                </div>
                <button className="p-1.5 rounded-md hover:bg-secondary_alt text-tertiary">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stat cards row */}
          <div className="flex gap-4 flex-wrap lg:flex-nowrap">
            <StatCard 
              label="RECONCILED" 
              value="$0.00" 
              count="0 payruns"
              change={{ value: "-100.0% from previous week", direction: "down" }}
              badgeValue="0.0%"
              badgeColor="green"
            />
            <StatCard 
              label="UNRECONCILED" 
              value="$0.00" 
              count="0 payruns"
              change={{ value: "-100.0% from previous week", direction: "down" }}
              badgeValue="0.0%"
              badgeColor="orange"
            />
            <StatCard 
              label="ISSUES" 
              value="$0.00" 
              count="0 payruns"
              badgeValue="0.0%"
              badgeColor="red"
            />
          </div>

          {/* Chart cards row */}
          <div className="flex gap-4 flex-wrap lg:flex-nowrap">
            <ChartCard title="Reconciliation Split" />
            <ChartCard title="Amounts by Insurer" />
          </div>

          {/* Lists row */}
          <div className="flex gap-4 flex-wrap xl:flex-nowrap">
            <ListCard 
              title="Recent Payruns"
              tabs={listTabs}
              activeTab={payrunTab}
              onTabChange={(t) => setPayrunTab(t as PayrunTab)}
              emptyMessage="No payruns in this period."
            />
            <ListCard 
              title="Recent Transactions"
              tabs={listTabs}
              activeTab={transactionTab}
              onTabChange={(t) => setTransactionTab(t as PayrunTab)}
              emptyMessage="No transactions in this period."
            />
            <UserActivityCard activities={MOCK_USER_ACTIVITY} />
          </div>
        </div>
      </main>
    </div>
  );
}
