import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  Users01, FileCheck01, CurrencyDollar, ClipboardCheck, Activity,
  Download01, Calendar, SearchLg, CheckCircle, Clock, AlertCircle,
  File01, Building01, Briefcase01, ChartBreakoutSquare, Play,
} from "@untitledui/icons";
import type { FC } from "react";

// ─── Export Groups Configuration ─────────────────────────────────────────────
const exportGroups = [
  {
    id: "clients",
    label: "Clients",
    icon: Users01,
    tabs: [
      { id: "all-clients", label: "All Clients" },
      { id: "active-clients", label: "Active Clients" },
      { id: "inactive-clients", label: "Inactive Clients" },
      { id: "client-contacts", label: "Client Contacts" },
      { id: "client-notes", label: "Client Notes" },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    icon: Activity,
    tabs: [
      { id: "all-leads", label: "All Leads" },
      { id: "assigned-leads", label: "Assigned Leads" },
      { id: "unassigned-leads", label: "Unassigned Leads" },
      { id: "converted-leads", label: "Converted Leads" },
      { id: "lead-activity", label: "Lead Activity Log" },
    ],
  },
  {
    id: "policies",
    label: "Policies",
    icon: FileCheck01,
    tabs: [
      { id: "all-policies", label: "All Policies" },
      { id: "active-policies", label: "Active Policies" },
      { id: "lapsed-policies", label: "Lapsed Policies" },
      { id: "pending-policies", label: "Pending Policies" },
      { id: "policy-renewals", label: "Policy Renewals" },
    ],
  },
  {
    id: "commissions",
    label: "Commissions",
    icon: CurrencyDollar,
    tabs: [
      { id: "all-commissions", label: "All Commissions" },
      { id: "upfront-commissions", label: "Upfront Commissions" },
      { id: "trail-commissions", label: "Trail Commissions" },
      { id: "clawbacks", label: "Clawbacks" },
      { id: "adviser-splits", label: "Adviser Splits" },
    ],
  },
  {
    id: "submissions",
    label: "Submissions",
    icon: ClipboardCheck,
    tabs: [
      { id: "all-submissions", label: "All Submissions" },
      { id: "pending-submissions", label: "Pending Submissions" },
      { id: "approved-submissions", label: "Approved Submissions" },
      { id: "declined-submissions", label: "Declined Submissions" },
      { id: "submission-history", label: "Submission History" },
    ],
  },
];

// ─── Export History Mock Data ────────────────────────────────────────────────
const EXPORT_HISTORY = [
  { id: 1, name: "All Clients Export", type: "Clients", records: 1245, createdBy: "Silvana P", createdAt: "30 Mar 2026, 11:45 AM", status: "Completed" },
  { id: 2, name: "Active Policies Q1 2026", type: "Policies", records: 892, createdBy: "Wilson C", createdAt: "29 Mar 2026, 3:20 PM", status: "Completed" },
  { id: 3, name: "Lead Activity March", type: "Leads", records: 3421, createdBy: "Gary B", createdAt: "29 Mar 2026, 10:15 AM", status: "Completed" },
  { id: 4, name: "Commission Report Q1", type: "Commissions", records: 567, createdBy: "Matthew W", createdAt: "28 Mar 2026, 4:30 PM", status: "Completed" },
  { id: 5, name: "Pending Submissions", type: "Submissions", records: 45, createdBy: "Natasha C", createdAt: "28 Mar 2026, 9:00 AM", status: "Processing" },
];

// ─── Field Configuration by Export Type ─────────────────────────────────────
const EXPORT_FIELDS: Record<string, { id: string; label: string; default: boolean }[]> = {
  "clients": [
    { id: "name", label: "Full Name", default: true },
    { id: "email", label: "Email Address", default: true },
    { id: "phone", label: "Phone Number", default: true },
    { id: "address", label: "Address", default: true },
    { id: "dob", label: "Date of Birth", default: false },
    { id: "occupation", label: "Occupation", default: false },
    { id: "employer", label: "Employer", default: false },
    { id: "salary", label: "Salary", default: false },
    { id: "adviser", label: "Assigned Adviser", default: true },
    { id: "created", label: "Created Date", default: true },
    { id: "status", label: "Status", default: true },
  ],
  "leads": [
    { id: "name", label: "Lead Name", default: true },
    { id: "email", label: "Email", default: true },
    { id: "phone", label: "Phone", default: true },
    { id: "source", label: "Lead Source", default: true },
    { id: "status", label: "Status", default: true },
    { id: "adviser", label: "Assigned To", default: true },
    { id: "created", label: "Created Date", default: true },
    { id: "lastContact", label: "Last Contact", default: false },
    { id: "notes", label: "Notes", default: false },
  ],
  "policies": [
    { id: "policyNumber", label: "Policy Number", default: true },
    { id: "client", label: "Client Name", default: true },
    { id: "insurer", label: "Insurer", default: true },
    { id: "product", label: "Product Type", default: true },
    { id: "sumInsured", label: "Sum Insured", default: true },
    { id: "premium", label: "Premium", default: true },
    { id: "frequency", label: "Payment Frequency", default: false },
    { id: "startDate", label: "Start Date", default: true },
    { id: "renewalDate", label: "Renewal Date", default: false },
    { id: "status", label: "Status", default: true },
    { id: "adviser", label: "Adviser", default: true },
  ],
  "commissions": [
    { id: "policyNumber", label: "Policy Number", default: true },
    { id: "client", label: "Client Name", default: true },
    { id: "insurer", label: "Insurer", default: true },
    { id: "type", label: "Commission Type", default: true },
    { id: "amount", label: "Amount", default: true },
    { id: "gst", label: "GST", default: false },
    { id: "netAmount", label: "Net Amount", default: true },
    { id: "adviser", label: "Adviser", default: true },
    { id: "split", label: "Split %", default: false },
    { id: "paymentDate", label: "Payment Date", default: true },
  ],
  "submissions": [
    { id: "submissionId", label: "Submission ID", default: true },
    { id: "client", label: "Client Name", default: true },
    { id: "insurer", label: "Insurer", default: true },
    { id: "product", label: "Product", default: true },
    { id: "sumInsured", label: "Sum Insured", default: true },
    { id: "premium", label: "Premium", default: true },
    { id: "submittedDate", label: "Submitted Date", default: true },
    { id: "adviser", label: "Adviser", default: true },
    { id: "status", label: "Status", default: true },
    { id: "outcome", label: "Outcome", default: false },
  ],
};

// ─── Export Builder Component ────────────────────────────────────────────────
function ExportBuilder({ groupId, tabId }: { groupId: string; tabId: string }) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => {
    const fields = EXPORT_FIELDS[groupId] || EXPORT_FIELDS["clients"];
    return new Set(fields.filter(f => f.default).map(f => f.id));
  });
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [format, setFormat] = useState<"csv" | "xlsx">("csv");
  const [isExporting, setIsExporting] = useState(false);

  const fields = EXPORT_FIELDS[groupId] || EXPORT_FIELDS["clients"];
  const group = exportGroups.find(g => g.id === groupId);
  const tab = group?.tabs.find(t => t.id === tabId);

  const toggleField = (fieldId: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldId)) {
      newSelected.delete(fieldId);
    } else {
      newSelected.add(fieldId);
    }
    setSelectedFields(newSelected);
  };

  const selectAll = () => setSelectedFields(new Set(fields.map(f => f.id)));
  const selectNone = () => setSelectedFields(new Set());

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      alert(`Export started: ${tab?.label} with ${selectedFields.size} fields as ${format.toUpperCase()}`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Export Configuration Card */}
      <div className="bg-primary rounded-xl border border-secondary">
        <div className="p-4 border-b border-secondary">
          <h3 className="text-base font-semibold text-primary">{tab?.label}</h3>
          <p className="text-sm text-tertiary mt-1">Configure your export settings and select the fields to include.</p>
        </div>

        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Date Range (Optional)</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
                <input 
                  type="date" 
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand"
                  placeholder="From"
                />
              </div>
              <span className="text-tertiary">to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
                <input 
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand"
                  placeholder="To"
                />
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Export Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat("csv")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  format === "csv" 
                    ? "border-brand bg-brand-secondary/10 text-brand-secondary" 
                    : "border-secondary text-secondary hover:bg-secondary_alt"
                }`}
              >
                <File01 className="size-4" />
                CSV
              </button>
              <button
                onClick={() => setFormat("xlsx")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  format === "xlsx" 
                    ? "border-brand bg-brand-secondary/10 text-brand-secondary" 
                    : "border-secondary text-secondary hover:bg-secondary_alt"
                }`}
              >
                <File01 className="size-4" />
                Excel (XLSX)
              </button>
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary">Fields to Export</label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-brand-secondary hover:underline">Select All</button>
                <span className="text-tertiary">|</span>
                <button onClick={selectNone} className="text-xs text-brand-secondary hover:underline">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {fields.map(field => (
                <label 
                  key={field.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedFields.has(field.id) 
                      ? "border-brand bg-brand-secondary/5" 
                      : "border-secondary hover:bg-secondary_alt"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="size-4 rounded border-secondary text-brand-solid focus:ring-brand"
                  />
                  <span className="text-sm text-primary">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="p-4 border-t border-secondary bg-secondary_alt/30 flex items-center justify-between">
          <p className="text-sm text-tertiary">
            {selectedFields.size} of {fields.length} fields selected
          </p>
          <button
            onClick={handleExport}
            disabled={selectedFields.size === 0 || isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download01 className="size-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="bg-primary rounded-xl border border-secondary">
        <div className="p-4 border-b border-secondary">
          <h3 className="text-base font-semibold text-primary">Recent Exports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-white uppercase" style={{ backgroundColor: "#3B485B" }}>
                <th className="px-4 py-3">Export Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {EXPORT_HISTORY.map(exp => (
                <tr key={exp.id} className="hover:bg-secondary_alt">
                  <td className="px-4 py-3 text-sm font-medium text-primary">{exp.name}</td>
                  <td className="px-4 py-3 text-sm text-tertiary">{exp.type}</td>
                  <td className="px-4 py-3 text-sm text-tertiary">{exp.records.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-brand-secondary">{exp.createdBy}</td>
                  <td className="px-4 py-3 text-sm text-tertiary">{exp.createdAt}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      exp.status === "Completed" 
                        ? "bg-success-secondary text-success-primary" 
                        : "bg-warning-secondary text-warning-primary"
                    }`}>
                      {exp.status === "Completed" ? <CheckCircle className="size-3" /> : <Clock className="size-3" />}
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {exp.status === "Completed" && (
                      <button className="p-1.5 rounded hover:bg-secondary text-fg-quaternary hover:text-primary">
                        <Download01 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Exports Page ───────────────────────────────────────────────────────
export function ExportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current group and tab from URL params
  const currentGroupId = searchParams.get("group") || "clients";
  const currentTabId = searchParams.get("tab") || "";
  
  const currentGroup = exportGroups.find(g => g.id === currentGroupId) || exportGroups[0];
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
          <ExportBuilder groupId={currentGroupId} tabId={activeTabId} />
        </div>
      </main>
    </div>
  );
}
