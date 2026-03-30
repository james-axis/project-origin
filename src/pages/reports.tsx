import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  Users01, TrendUp01, Target01, FileCheck01, Activity, Clock,
  RefreshCw01, Zap, ClipboardCheck, MessageSquare01, Mail01,
  File01, Edit01, FileSearch01, Calendar, ChartBreakoutSquare,
  Download01, FilterLines, SearchLg, ChevronDown, Printer, ArrowRight,
} from "@untitledui/icons";
import type { FC } from "react";

// ─── Report Groups Configuration ─────────────────────────────────────────────
const reportGroups = [
  {
    id: "leads",
    label: "Leads",
    icon: Users01,
    tabs: [
      { id: "lead-stream", label: "Lead Stream" },
      { id: "adviser-performance", label: "Adviser Performance Summary" },
      { id: "adviser-lead-analysis", label: "Adviser Lead Analysis" },
      { id: "lead-flow", label: "Lead Flow Report" },
      { id: "roi-report", label: "ROI Report" },
      { id: "assigned-leads", label: "Assigned Leads" },
      { id: "leads-assignment-history", label: "Leads Assignment History" },
      { id: "activity-summary", label: "Activity Summary" },
      { id: "daily-tracker", label: "Daily Tracker" },
      { id: "status-change-log", label: "Status Change Log" },
      { id: "status-conversions", label: "Status Conversions" },
      { id: "action-log", label: "Action Log" },
      { id: "action-audit", label: "Action Audit" },
    ],
  },
  {
    id: "applications",
    label: "Applications",
    icon: FileCheck01,
    tabs: [
      { id: "webform-submissions", label: "Webform Submissions" },
      { id: "sms-log", label: "SMS Log" },
      { id: "sms-usage", label: "SMS Usage" },
      { id: "task-log", label: "Task Log" },
      { id: "signature-requests", label: "Signature Requests" },
      { id: "quotes", label: "Quotes" },
    ],
  },
  {
    id: "submissions",
    label: "Submissions",
    icon: ClipboardCheck,
    tabs: [
      { id: "super-rollovers", label: "Super Rollovers" },
      { id: "day-by-day", label: "Day by Day Submissions & Completions" },
      { id: "submissions-all", label: "Submissions" },
      { id: "submissions-weekly", label: "Submissions Weekly" },
      { id: "submissions-monthly", label: "Submissions Monthly" },
      { id: "submissions-per-company", label: "Submissions per Company" },
    ],
  },
  {
    id: "completions",
    label: "Completions",
    icon: ChartBreakoutSquare,
    tabs: [
      { id: "expected-completions-weekly", label: "Expected Completions Weekly" },
      { id: "expected-completions-monthly", label: "Expected Completions Monthly" },
      { id: "completions-weekly", label: "Completions Weekly" },
      { id: "completions-monthly", label: "Completions Monthly" },
      { id: "completions-per-company", label: "Completions per Company" },
      { id: "closed-apps-weekly", label: "Closed Apps Weekly" },
      { id: "closed-apps-monthly", label: "Closed Apps Monthly" },
    ],
  },
];

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_LEADS = [
  { id: 1, customer: "Paul Naumann", salary: "-", state: "ACT", employment: "N/A", occupation: "Maintenance supervisor", submitted: "03/30 12:40", assignedTo: "Advice_Team", status: "Prospect" },
  { id: 2, customer: "Ms Kazumi Ng", salary: "$59,000", state: "WA", employment: "Employed full-time", occupation: "Ambulance Officer", submitted: "03/30 12:17", assignedTo: "Silvana P", status: "Scheduled Appoint" },
  { id: 3, customer: "Tristian Higginbottom", salary: "-", state: "VIC", employment: "N/A", occupation: "Carpenter", submitted: "03/30 12:08", assignedTo: "Matthew W", status: "Prospect" },
  { id: 4, customer: "Mr Angas Tiernan", salary: "$165,000", state: "VIC", employment: "Self-Employed", occupation: "Chief Executive Officer/General Manager", submitted: "03/30 11:54", assignedTo: "Gary B", status: "Quote Sent" },
  { id: 5, customer: "Ms Kazumi", salary: "$59,000", state: "WA", employment: "Employed full-time", occupation: "Ambulance Officer", submitted: "03/30 11:48", assignedTo: "Silvana P", status: "Prospect" },
  { id: 6, customer: "Amit Hetson", salary: "$113,000", state: "NSW", employment: "Employed full-time", occupation: "Scientist (Lab)", submitted: "03/30 11:37", assignedTo: "Wilson C", status: "Prospect" },
  { id: 7, customer: "Mr Gustavo Martins", salary: "$330,000", state: "QLD", employment: "Employed full-time", occupation: "Director", submitted: "03/30 11:32", assignedTo: "Natasha C", status: "Prospect" },
  { id: 8, customer: "Amit Hetson", salary: "$113,000", state: "VIC", employment: "Employed full-time", occupation: "Scientist (Lab)", submitted: "03/30 11:31", assignedTo: "Wilson C", status: "Prospect" },
  { id: 9, customer: "Ms Robyn Griffin", salary: "$53,000", state: "QLD", employment: "Employed full-time", occupation: "Cleaner", submitted: "03/30 11:28", assignedTo: "Silvana P", status: "Application Pending" },
  { id: 10, customer: "Matthew Williamson", salary: "-", state: "-", employment: "N/A", occupation: "-", submitted: "03/30 11:25", assignedTo: "Unassigned", status: "Prospect" },
];

const MOCK_ADVISER_PERFORMANCE = [
  { adviser: "Silvana P", leads: 45, contacted: 38, appointments: 22, quotes: 18, applications: 12, completions: 8, conversionRate: "17.8%" },
  { adviser: "Wilson C", leads: 52, contacted: 44, appointments: 28, quotes: 20, applications: 15, completions: 11, conversionRate: "21.2%" },
  { adviser: "Gary B", leads: 38, contacted: 32, appointments: 18, quotes: 14, applications: 10, completions: 7, conversionRate: "18.4%" },
  { adviser: "Matthew W", leads: 41, contacted: 35, appointments: 20, quotes: 16, applications: 11, completions: 9, conversionRate: "22.0%" },
  { adviser: "Natasha C", leads: 33, contacted: 28, appointments: 15, quotes: 12, applications: 8, completions: 6, conversionRate: "18.2%" },
  { adviser: "Nathan S", leads: 29, contacted: 24, appointments: 14, quotes: 10, applications: 7, completions: 5, conversionRate: "17.2%" },
];

const MOCK_SMS_LOG = [
  { id: 1, date: "03/30 12:45", customer: "Paul Naumann", direction: "Outbound", adviser: "Advice_Team", message: "Hi Paul, thanks for your enquiry...", status: "Delivered" },
  { id: 2, date: "03/30 12:30", customer: "Ms Kazumi Ng", direction: "Inbound", adviser: "Silvana P", message: "Yes I'm available Thursday...", status: "Received" },
  { id: 3, date: "03/30 11:55", customer: "Mr Angas Tiernan", direction: "Outbound", adviser: "Gary B", message: "Your quote is ready...", status: "Delivered" },
  { id: 4, date: "03/30 11:20", customer: "Amit Hetson", direction: "Outbound", adviser: "Wilson C", message: "Thanks for your interest...", status: "Delivered" },
  { id: 5, date: "03/30 10:45", customer: "Mr Gustavo Martins", direction: "Inbound", adviser: "Natasha C", message: "Can we schedule for Monday?", status: "Received" },
];

const MOCK_SUBMISSIONS = [
  { id: 1, customer: "Sarah Mitchell", insurer: "TAL", product: "Life Cover", sumInsured: "$750,000", premium: "$125/mo", submitted: "03/30 11:45", adviser: "Silvana P", status: "Pending" },
  { id: 2, customer: "James Chen", insurer: "Zurich", product: "Income Protection", sumInsured: "$8,000/mo", premium: "$210/mo", submitted: "03/30 10:30", adviser: "Wilson C", status: "Under Review" },
  { id: 3, customer: "Emma Thompson", insurer: "MetLife", product: "TPD", sumInsured: "$500,000", premium: "$85/mo", submitted: "03/29 16:20", adviser: "Gary B", status: "Approved" },
  { id: 4, customer: "Michael Roberts", insurer: "ClearView", product: "Trauma", sumInsured: "$300,000", premium: "$145/mo", submitted: "03/29 14:10", adviser: "Matthew W", status: "Pending" },
  { id: 5, customer: "Lisa Anderson", insurer: "NEOS", product: "Life Cover", sumInsured: "$1,000,000", premium: "$165/mo", submitted: "03/29 11:55", adviser: "Natasha C", status: "Approved" },
];

const MOCK_COMPLETIONS = [
  { id: 1, customer: "David Wilson", insurer: "TAL", product: "Life Cover", sumInsured: "$500,000", annualPremium: "$1,440", completed: "03/30 09:15", adviser: "Silvana P" },
  { id: 2, customer: "Jennifer Lee", insurer: "Zurich", product: "Income Protection", sumInsured: "$6,000/mo", annualPremium: "$2,280", completed: "03/29 15:30", adviser: "Wilson C" },
  { id: 3, customer: "Robert Taylor", insurer: "MetLife", product: "TPD", sumInsured: "$400,000", annualPremium: "$960", completed: "03/29 11:20", adviser: "Gary B" },
  { id: 4, customer: "Amanda Brown", insurer: "ClearView", product: "Life Cover", sumInsured: "$750,000", annualPremium: "$1,680", completed: "03/28 16:45", adviser: "Matthew W" },
];

// ─── Report Table Component ──────────────────────────────────────────────────
function ReportTable({ 
  columns, 
  data,
  title,
  showToolbar = true,
}: { 
  columns: { key: string; label: string; width?: string }[];
  data: Record<string, string | number>[];
  title?: string;
  showToolbar?: boolean;
}) {
  const [search, setSearch] = useState("");
  
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  return (
    <div className="bg-primary rounded-xl border border-secondary">
      {showToolbar && (
        <div className="flex items-center justify-between p-4 border-b border-secondary flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
              <input 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary_alt">
              <FilterLines className="size-4" /> Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary_alt">
              <Printer className="size-4" /> Print
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-secondary text-sm font-medium text-secondary hover:bg-secondary_alt">
              <Download01 className="size-4" /> Export
            </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3" style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary">
            {filteredData.map((row, idx) => (
              <tr key={idx} className="hover:bg-secondary_alt">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-sm ${
                    col.key === "customer" || col.key === "adviser" ? "text-brand-secondary font-medium" : "text-primary"
                  }`}>
                    {col.key === "status" || col.key === "direction" ? (
                      <span className="text-xs text-tertiary">
                        {row[col.key]}
                      </span>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-3 border-t border-secondary flex items-center justify-between text-sm text-tertiary">
        <span>Showing {filteredData.length} of {data.length} results</span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded border border-secondary hover:bg-secondary_alt">Previous</button>
          <button className="px-3 py-1 rounded border border-secondary hover:bg-secondary_alt">Next</button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Content Components ───────────────────────────────────────────────

// Lead Stream Report
function LeadStreamReport() {
  const columns = [
    { key: "customer", label: "Customer", width: "180px" },
    { key: "salary", label: "Salary", width: "100px" },
    { key: "state", label: "State", width: "60px" },
    { key: "employment", label: "Employment", width: "140px" },
    { key: "occupation", label: "Occupation", width: "200px" },
    { key: "submitted", label: "Submitted", width: "110px" },
    { key: "assignedTo", label: "Assigned To", width: "120px" },
    { key: "status", label: "Status", width: "140px" },
  ];
  return <ReportTable columns={columns} data={MOCK_LEADS} />;
}

// Adviser Performance Summary
function AdviserPerformanceReport() {
  const columns = [
    { key: "adviser", label: "Adviser", width: "140px" },
    { key: "leads", label: "Leads", width: "80px" },
    { key: "contacted", label: "Contacted", width: "90px" },
    { key: "appointments", label: "Appointments", width: "100px" },
    { key: "quotes", label: "Quotes", width: "80px" },
    { key: "applications", label: "Applications", width: "100px" },
    { key: "completions", label: "Completions", width: "100px" },
    { key: "conversionRate", label: "Conversion %", width: "100px" },
  ];
  return <ReportTable columns={columns} data={MOCK_ADVISER_PERFORMANCE} />;
}

// SMS Log Report
function SMSLogReport() {
  const columns = [
    { key: "date", label: "Date", width: "110px" },
    { key: "customer", label: "Customer", width: "160px" },
    { key: "direction", label: "Direction", width: "100px" },
    { key: "adviser", label: "Adviser", width: "120px" },
    { key: "message", label: "Message", width: "300px" },
    { key: "status", label: "Status", width: "100px" },
  ];
  return <ReportTable columns={columns} data={MOCK_SMS_LOG} />;
}

// Submissions Report
function SubmissionsReport() {
  const columns = [
    { key: "customer", label: "Customer", width: "160px" },
    { key: "insurer", label: "Insurer", width: "100px" },
    { key: "product", label: "Product", width: "140px" },
    { key: "sumInsured", label: "Sum Insured", width: "120px" },
    { key: "premium", label: "Premium", width: "100px" },
    { key: "submitted", label: "Submitted", width: "120px" },
    { key: "adviser", label: "Adviser", width: "120px" },
    { key: "status", label: "Status", width: "100px" },
  ];
  return <ReportTable columns={columns} data={MOCK_SUBMISSIONS} />;
}

// Completions Report
function CompletionsReport() {
  const columns = [
    { key: "customer", label: "Customer", width: "160px" },
    { key: "insurer", label: "Insurer", width: "100px" },
    { key: "product", label: "Product", width: "140px" },
    { key: "sumInsured", label: "Sum Insured", width: "120px" },
    { key: "annualPremium", label: "Annual Premium", width: "120px" },
    { key: "completed", label: "Completed", width: "120px" },
    { key: "adviser", label: "Adviser", width: "120px" },
  ];
  return <ReportTable columns={columns} data={MOCK_COMPLETIONS} />;
}

// Placeholder Report Component
function PlaceholderReport({ title }: { title: string }) {
  return (
    <div className="bg-primary rounded-xl border border-secondary p-12 text-center">
      <div className="size-16 rounded-full bg-secondary_alt flex items-center justify-center mx-auto mb-4">
        <ChartBreakoutSquare className="size-8 text-fg-quaternary" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-tertiary max-w-md mx-auto mb-6">
        This report will display data once configured. Select date range and filters to generate the report.
      </p>
      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover mx-auto">
        Generate Report <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

// ─── Report Content Router ───────────────────────────────────────────────────
function ReportContent({ groupId, tabId }: { groupId: string; tabId: string }) {
  // Leads group
  if (groupId === "leads") {
    if (tabId === "lead-stream") return <LeadStreamReport />;
    if (tabId === "adviser-performance") return <AdviserPerformanceReport />;
    return <PlaceholderReport title={reportGroups.find(g => g.id === groupId)?.tabs.find(t => t.id === tabId)?.label || "Report"} />;
  }
  
  // Applications group
  if (groupId === "applications") {
    if (tabId === "sms-log") return <SMSLogReport />;
    return <PlaceholderReport title={reportGroups.find(g => g.id === groupId)?.tabs.find(t => t.id === tabId)?.label || "Report"} />;
  }
  
  // Submissions group
  if (groupId === "submissions") {
    if (tabId === "submissions-all") return <SubmissionsReport />;
    return <PlaceholderReport title={reportGroups.find(g => g.id === groupId)?.tabs.find(t => t.id === tabId)?.label || "Report"} />;
  }
  
  // Completions group
  if (groupId === "completions") {
    if (tabId === "completions-weekly" || tabId === "completions-monthly") return <CompletionsReport />;
    return <PlaceholderReport title={reportGroups.find(g => g.id === groupId)?.tabs.find(t => t.id === tabId)?.label || "Report"} />;
  }
  
  return <PlaceholderReport title="Report" />;
}

// ─── Main Reports Page ───────────────────────────────────────────────────────
export function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current group and tab from URL params
  const currentGroupId = searchParams.get("group") || "leads";
  const currentTabId = searchParams.get("tab") || "";
  
  const currentGroup = reportGroups.find(g => g.id === currentGroupId) || reportGroups[0];
  // Default to first tab if not specified
  const activeTabId = currentTabId || currentGroup.tabs[0]?.id || "";
  
  const handleTabChange = (tabId: string) => {
    setSearchParams({ group: currentGroupId, tab: tabId });
  };

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* Header with group name and sub-tabs */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
            {currentGroup.label}
          </h1>
          
          {/* Sub-tabs for current group */}
          {currentGroup.tabs.length > 0 && (
            <div className="flex overflow-x-auto gap-6 -mb-px">
              {currentGroup.tabs.map(tab => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={"py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand-solid text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <ReportContent groupId={currentGroupId} tabId={activeTabId} />
        </div>
      </main>
    </div>
  );
}
