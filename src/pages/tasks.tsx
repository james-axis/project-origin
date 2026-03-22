import { useState, useMemo } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Check, Download01, Plus, X } from "@untitledui/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type TaskTab = "all" | "scheduled";

type ObjectType = "lead" | "application" | "claim" | "dishonour" | "complaint" | "policy";

interface Task {
  id: number;
  name: string;
  object: ObjectType;
  customerName: string;
  state: string;
  group: string;
  assignedTo: string;
  scheduled: string | null;
  requested: string;
  lastAction: string;
  creator: string;
  lastNote: string;
  taskType: string;
  overdue: boolean;
}

interface ScheduledTask {
  id: number;
  task: string;
  object: ObjectType;
  customerName: string;
  state: string;
  group: string;
  assignedTo: string;
  scheduled: string;
  requested: string;
  creator: string;
  note: string;
}

// ─── Mock data seeded from real DB records ───────────────────────────────────
const GROUPS = [
  "UFinancial", "Surety", "Vital", "Hunter Galloway",
  "Armor Insurance Solutions", "CH Life", "Covered Life", "DGB Insurance Solutions",
  "Bestplan", "Assurance Insurance",
];

const USERS = [
  "James N", "John Rojas", "Maysee Chang", "Dean Hines", "Lucas Kenyon",
  "Nate Elston", "Advice Team", "Audits Team", "Adam Cowburn", "Caitlin Gardiner",
];

const TASK_TYPES = ["Call", "Note", "Update", "Email", "SMS", "Schedule", "File", "Document"];

const MOCK_ALL_TASKS: Task[] = [
  { id: 1, name: "Introduction Call", object: "lead", customerName: "Sophie Hartley", state: "Prospect", group: "Surety", assignedTo: "James N", scheduled: null, requested: "2026-03-23 09:00", lastAction: "2026-03-23 09:01", creator: "James N", lastNote: "Called — no answer, left voicemail", taskType: "Call", overdue: false },
  { id: 2, name: "Life Insurance Discussion", object: "application", customerName: "Ryan Castellano", state: "Quote Sent", group: "UFinancial", assignedTo: "John Rojas", scheduled: null, requested: "2026-03-23 08:30", lastAction: "2026-03-23 08:31", creator: "John Rojas", lastNote: "Discussed income protection options", taskType: "Call", overdue: false },
  { id: 3, name: "Compliance Audit", object: "application", customerName: "Mei Zhang", state: "Compliance Review", group: "Vital", assignedTo: "Audits Team", scheduled: null, requested: "2026-03-22 14:00", lastAction: "2026-03-22 16:00", creator: "Dean Hines", lastNote: "Audit in progress — pending sign-off", taskType: "Note", overdue: true },
  { id: 4, name: "Claim Follow-Up", object: "claim", customerName: "Natalie Brooks", state: "New Case", group: "Hunter Galloway", assignedTo: "Maysee Chang", scheduled: null, requested: "2026-03-21 10:00", lastAction: "2026-03-22 09:00", creator: "Maysee Chang", lastNote: "Awaiting medical documentation from GP", taskType: "Note", overdue: true },
  { id: 5, name: "Dishonour Resolution", object: "dishonour", customerName: "James O'Sullivan", state: "Action Required", group: "Surety", assignedTo: "James N", scheduled: null, requested: "2026-03-20 08:00", lastAction: "2026-03-23 07:00", creator: "James N", lastNote: "Bank details updated — re-submit direct debit", taskType: "Update", overdue: true },
  { id: 6, name: "Policy Renewal Review", object: "policy", customerName: "Aisha Patel", state: "Renewal Due", group: "UFinancial", assignedTo: "John Rojas", scheduled: "2026-04-01 10:00", requested: "2026-03-15 12:00", lastAction: "2026-03-20 11:00", creator: "John Rojas", lastNote: "Renewal 1 Nov — revisit cover reduction quote", taskType: "Schedule", overdue: false },
  { id: 7, name: "Initial Fact Find", object: "lead", customerName: "Tom Patterson", state: "Scheduled Appointment", group: "UFinancial", assignedTo: "James N", scheduled: "2026-03-25 14:00", requested: "2026-03-22 16:00", lastAction: "2026-03-22 16:00", creator: "James N", lastNote: "Appointment confirmed for 25 March 2pm", taskType: "Call", overdue: false },
  { id: 8, name: "Application Submission", object: "application", customerName: "Priya Mehta", state: "Add Policy/Application Number", group: "CH Life", assignedTo: "Maysee Chang", scheduled: null, requested: "2026-03-19 09:00", lastAction: "2026-03-22 10:00", creator: "Maysee Chang", lastNote: "Application lodged — awaiting insurer decision", taskType: "Document", overdue: false },
  { id: 9, name: "Complaint Acknowledgement", object: "complaint", customerName: "Daniel Okafor", state: "Open", group: "Covered Life", assignedTo: "Advice Team", scheduled: null, requested: "2026-03-18 13:00", lastAction: "2026-03-21 15:00", creator: "Advice Team", lastNote: "Acknowledged in writing — escalated to senior adviser", taskType: "Note", overdue: true },
  { id: 10, name: "Quote Presentation", object: "lead", customerName: "Marcus Chen", state: "Quote Sent", group: "DGB Insurance Solutions", assignedTo: "Lucas Kenyon", scheduled: "2026-03-26 11:00", requested: "2026-03-21 10:00", lastAction: "2026-03-22 09:00", creator: "Lucas Kenyon", lastNote: "Quote sent via email — follow up next week", taskType: "Email", overdue: false },
  { id: 11, name: "Inforce Confirmation", object: "policy", customerName: "Natalie Brooks", state: "Client", group: "Hunter Galloway", assignedTo: "Maysee Chang", scheduled: null, requested: "2026-03-17 09:00", lastAction: "2026-03-22 08:00", creator: "Maysee Chang", lastNote: "Policy confirmed inforce by TAL", taskType: "Update", overdue: false },
  { id: 12, name: "SMS Follow-Up", object: "lead", customerName: "Sophie Hartley", state: "Prospect", group: "Surety", assignedTo: "James N", scheduled: null, requested: "2026-03-23 10:00", lastAction: "2026-03-23 10:01", creator: "James N", lastNote: "SMS sent — awaiting reply", taskType: "SMS", overdue: false },
];

const MOCK_SCHEDULED: ScheduledTask[] = [
  { id: 1, task: "Policy Review Call", object: "policy", customerName: "Keshmini Raman", state: "Quote Sent", group: "UFinancial", assignedTo: "Dean Hines", scheduled: "2027-02-28 09:25", requested: "2026-02-18 10:00", creator: "Dean Hines", note: "Contact Kena to do her insurances. Her home construction should be completed." },
  { id: 2, task: "Application Review", object: "application", customerName: "Minh Thong David Hoang", state: "Add Policy/Application Number", group: "Surety", assignedTo: "Maysee Chang", scheduled: "2027-02-21 08:21", requested: "2026-02-19 09:00", creator: "Maysee Chang", note: "Review and remove spine exclusion? Check with David if he's had any symptoms or treatment." },
  { id: 3, task: "TPD Cover Review", object: "lead", customerName: "Robert Mackay", state: "Client", group: "Vital", assignedTo: "Maysee Chang", scheduled: "2027-01-01 11:21", requested: "2026-02-02 01:00", creator: "Maysee Chang", note: "Review - to add TPD cover? Check with Robert again as it was declined last year due to mental health history." },
  { id: 4, task: "Trauma Reinstatement", object: "claim", customerName: "Cong Khanh Dao", state: "New Case", group: "Hunter Galloway", assignedTo: "Maysee Chang", scheduled: "2026-12-03 08:30", requested: "2026-02-04 02:00", creator: "Maysee Chang", note: "Investigate Khanh's Trauma reinstatement option due this time." },
  { id: 5, task: "Renewal Touchbase", object: "policy", customerName: "Dean Douglas", state: "Client", group: "UFinancial", assignedTo: "Maysee Chang", scheduled: "2026-10-05 11:07", requested: "2026-02-20 01:00", creator: "Maysee Chang", note: "Touchbase as renewal 1 Nov - revisit cover reduction quote for Dean." },
  { id: 6, task: "Renewal Touchbase", object: "policy", customerName: "Kylie Rae Douglas", state: "Client", group: "UFinancial", assignedTo: "Maysee Chang", scheduled: "2026-09-14 12:06", requested: "2026-02-20 01:00", creator: "Maysee Chang", note: "Touchbase as renewal 11 Oct - revisit cover reduction quote for Kylie." },
  { id: 7, task: "DV Follow-Up", object: "lead", customerName: "Monica Blazic", state: "In Progress", group: "Covered Life", assignedTo: "Nate Elston", scheduled: "2026-07-28 10:30", requested: "2026-01-28 05:00", creator: "Nate Elston", note: "Client asked for FUP in 6 months still dealing with DV" },
  { id: 8, task: "Return to Work Review", object: "application", customerName: "Kirsty Kitchener", state: "Add Policy/Application Number", group: "Surety", assignedTo: "Maysee Chang", scheduled: "2026-07-06 12:29", requested: "2026-03-19 01:00", creator: "Maysee Chang", note: "Contact Kirsty for review - tpd any/own and IP after she returns to working" },
  { id: 9, task: "Income Cover Quote FU", object: "lead", customerName: "Analise Fairall", state: "Quote Sent", group: "Hunter Galloway", assignedTo: "Maysee Chang", scheduled: "2026-07-01 13:11", requested: "2026-03-09 02:00", creator: "Maysee Chang", note: "FU Analise for income cover quote - done in March. She's returning to work on 22 July from mat leave." },
  { id: 10, task: "Life Insurance Discussion", object: "application", customerName: "James Schiwy", state: "Scheduled Appointment", group: "UFinancial", assignedTo: "John Rojas", scheduled: "2026-04-15 08:00", requested: "2026-03-01 09:00", creator: "John Rojas", note: "Life Insurance Discussion (James & Rebecca)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) + " " +
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

const OBJECT_BADGE: Record<ObjectType, { label: string; cls: string }> = {
  lead:        { label: "Lead",        cls: "bg-blue-100 text-blue-700" },
  application: { label: "Application", cls: "bg-purple-100 text-purple-700" },
  claim:       { label: "Claim",       cls: "bg-red-100 text-red-700" },
  dishonour:   { label: "Dishonour",   cls: "bg-orange-100 text-orange-700" },
  complaint:   { label: "Complaint",   cls: "bg-yellow-100 text-yellow-700" },
  policy:      { label: "Policy",      cls: "bg-green-100 text-green-700" },
};

// ─── TasksPage ────────────────────────────────────────────────────────────────
export function TasksPage() {
  const [tab, setTab] = useState<TaskTab>("all");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [taskTypeFilter, setTaskTypeFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<string>("requested");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // ── Filtered + sorted All Tasks ──
  const filteredAll = useMemo(() => {
    let rows = MOCK_ALL_TASKS;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
      );
    }
    if (assigneeFilter !== "All") rows = rows.filter(r => r.assignedTo === assigneeFilter);
    if (groupFilter !== "All")    rows = rows.filter(r => r.group === groupFilter);
    if (taskTypeFilter !== "All") rows = rows.filter(r => r.taskType === taskTypeFilter);
    if (dateFilter === "today")   rows = rows.filter(r => r.requested.startsWith(new Date().toISOString().slice(0, 10)));
    if (dateFilter === "week")    rows = rows.filter(r => new Date(r.requested) >= new Date(Date.now() - 7 * 86400000));
    return [...rows].sort((a, b) => {
      const va = (a as any)[sortKey] ?? "";
      const vb = (b as any)[sortKey] ?? "";
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [search, assigneeFilter, groupFilter, taskTypeFilter, dateFilter, sortKey, sortDir]);

  // ── Filtered + sorted Scheduled ──
  const filteredScheduled = useMemo(() => {
    let rows = MOCK_SCHEDULED;
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.task.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q)
      );
    }
    if (assigneeFilter !== "All") rows = rows.filter(r => r.assignedTo === assigneeFilter);
    if (groupFilter !== "All")    rows = rows.filter(r => r.group === groupFilter);
    return rows;
  }, [search, assigneeFilter, groupFilter]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleRow(id: number) {
    setSelectedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedRows.size === filteredAll.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filteredAll.map(r => r.id)));
  }

  function downloadCSV() {
    const rows = tab === "all" ? filteredAll : filteredScheduled;
    const headers = tab === "all"
      ? ["Task","Object","Customer Name","State","Group","Assigned To","Scheduled","Requested","Last Action","Creator","Last Note"]
      : ["Task","Object","Customer Name","State","Group","Assigned To","Scheduled","Requested","Creator","Note"];
    const csv = [
      headers.join(","),
      ...rows.map(r => tab === "all"
        ? [(r as Task).name,(r as Task).object,(r as Task).customerName,(r as Task).state,(r as Task).group,(r as Task).assignedTo,(r as Task).scheduled ?? "",(r as Task).requested,(r as Task).lastAction,(r as Task).creator,(r as Task).lastNote].join(",")
        : [(r as ScheduledTask).task,(r as ScheduledTask).object,(r as ScheduledTask).customerName,(r as ScheduledTask).state,(r as ScheduledTask).group,(r as ScheduledTask).assignedTo,(r as ScheduledTask).scheduled,(r as ScheduledTask).requested,(r as ScheduledTask).creator,(r as ScheduledTask).note].join(",")
      )
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `tasks-${tab}-${Date.now()}.csv`;
    a.click();
  }

  const SortTh = ({ k, label, className = "" }: { k: string; label: string; className?: string }) => (
    <th onClick={() => toggleSort(k)}
      className={"cursor-pointer select-none px-3 py-3 text-left text-xs font-medium text-quaternary hover:text-tertiary whitespace-nowrap " + className}>
      <span className="inline-flex items-center gap-1">
        {label}
        <svg className={"size-3 transition-opacity " + (sortKey === k ? "opacity-100" : "opacity-30")} viewBox="0 0 10 12" fill="currentColor">
          {sortDir === "asc" && sortKey === k
            ? <path d="M5 1l4 5H1zM5 11l-4-5h8z" opacity="0.3" />
            : sortDir === "desc" && sortKey === k
              ? <path d="M5 1l4 5H1z" opacity="0.3" />
              : <path d="M5 1l4 5H1zM5 11l-4-5h8z" opacity="0.4" />}
        </svg>
      </span>
    </th>
  );

  const overdueCount = MOCK_ALL_TASKS.filter(t => t.overdue).length;
  const todayCount   = MOCK_ALL_TASKS.filter(t => t.scheduled && !isOverdue(t.scheduled)).length;

  return (
    <div className="lg:flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* ── Header ── */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                Your Tasks
              </h1>
              <p className="text-sm text-tertiary mt-0.5">
                {filteredAll.length} tasks · {overdueCount > 0 && <span className="text-error-primary font-medium">{overdueCount} overdue · </span>}{todayCount} due today
              </p>
            </div>

            {/* Top filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="all">Select Dates...</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
              </select>
              <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">All Users</option>
                {USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">Group</option>
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={taskTypeFilter} onChange={e => setTaskTypeFilter(e.target.value)}
                className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer min-w-[120px]">
                <option value="All">Task Type</option>
                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 -mb-px">
            {([
              { key: "all",       label: "All Tasks",  count: MOCK_ALL_TASKS.length },
              { key: "scheduled", label: "Scheduled",  count: MOCK_SCHEDULED.length },
            ] as const).map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " +
                  (tab === key ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}
                <span className={"rounded-full px-1.5 py-0.5 text-[10px] font-semibold " +
                  (tab === key ? "bg-brand-secondary text-brand-secondary" : "bg-secondary text-quaternary")}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Task name..."
              className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-2 text-sm text-primary outline-none focus:border-brand" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">{selectedRows.size} selected</span>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
                Assign To ▾
              </button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {(search || assigneeFilter !== "All" || groupFilter !== "All" || taskTypeFilter !== "All") && (
              <button onClick={() => { setSearch(""); setAssigneeFilter("All"); setGroupFilter("All"); setTaskTypeFilter("All"); }}
                className="text-sm text-brand-secondary hover:underline">
                Clear filters
              </button>
            )}
            <button onClick={downloadCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              <Download01 className="size-4 text-success-primary" />
              Download CSV
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4">
          {tab === "all" ? (
            <div className="rounded-xl border border-secondary overflow-hidden">
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead className="bg-secondary_alt border-b border-secondary">
                  <tr>
                    <th className="px-3 py-3 w-10">
                      <input type="checkbox"
                        checked={selectedRows.size === filteredAll.length && filteredAll.length > 0}
                        onChange={toggleAll}
                        className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                    </th>
                    <SortTh k="name"        label="Task"          className="min-w-[180px]" />
                    <SortTh k="object"      label="Object" />
                    <SortTh k="customerName" label="Customer Name" />
                    <SortTh k="state"       label="State" />
                    <SortTh k="group"       label="Group" />
                    <SortTh k="assignedTo"  label="Assigned To" />
                    <SortTh k="scheduled"   label="Scheduled" />
                    <SortTh k="requested"   label="Requested" />
                    <SortTh k="lastAction"  label="Last Action" />
                    <SortTh k="creator"     label="Creator" />
                    <th className="px-3 py-3 text-left text-xs font-medium text-quaternary whitespace-nowrap">Last Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary bg-primary">
                  {filteredAll.length === 0 ? (
                    <tr><td colSpan={12} className="px-4 py-16 text-center text-sm text-quaternary">No tasks found</td></tr>
                  ) : filteredAll.map(task => (
                    <tr key={task.id}
                      className={"group transition-colors hover:bg-secondary_alt cursor-pointer " + (task.overdue ? "bg-[#FFFAF9]" : "")}>
                      <td className="px-3 py-3">
                        <input type="checkbox" checked={selectedRows.has(task.id)} onChange={() => toggleRow(task.id)}
                          className="rounded border-secondary accent-[#D34108] size-4 cursor-pointer" />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {task.overdue && <span className="size-1.5 rounded-full bg-error-primary shrink-0" />}
                          <span className="font-medium text-primary group-hover:text-brand-secondary transition-colors">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " + OBJECT_BADGE[task.object].cls}>
                          {OBJECT_BADGE[task.object].label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-primary font-medium">{task.customerName}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.state}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.group}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.assignedTo}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">
                        {task.scheduled ? (
                          <span className={isOverdue(task.scheduled) ? "text-error-primary font-medium" : ""}>
                            {formatDateTime(task.scheduled)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-3 text-tertiary text-xs">{formatDateTime(task.requested)}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{formatDateTime(task.lastAction)}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.creator}</td>
                      <td className="px-3 py-3 max-w-[200px]">
                        <p className="text-xs text-tertiary truncate">{task.lastNote}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── Scheduled table ── */
            <div className="rounded-xl border border-secondary overflow-hidden">
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead className="bg-secondary_alt border-b border-secondary">
                  <tr>
                    <SortTh k="task"         label="Task"          className="px-4 min-w-[180px]" />
                    <SortTh k="object"       label="Object" />
                    <SortTh k="customerName" label="Customer Name" />
                    <SortTh k="state"        label="State" />
                    <SortTh k="group"        label="Group" />
                    <SortTh k="assignedTo"   label="Assigned To" />
                    <SortTh k="scheduled"    label="Scheduled" />
                    <SortTh k="requested"    label="Requested" />
                    <SortTh k="creator"      label="Creator" />
                    <th className="px-3 py-3 text-left text-xs font-medium text-quaternary">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary bg-primary">
                  {filteredScheduled.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-16 text-center text-sm text-quaternary">No scheduled tasks found</td></tr>
                  ) : filteredScheduled.map(task => (
                    <tr key={task.id} className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-primary group-hover:text-brand-secondary transition-colors">{task.task}</td>
                      <td className="px-3 py-3">
                        <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold " + OBJECT_BADGE[task.object].cls}>
                          {OBJECT_BADGE[task.object].label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-primary font-medium">{task.customerName}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.state}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.group}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.assignedTo}</td>
                      <td className="px-3 py-3 text-xs">
                        <span className={isOverdue(task.scheduled) ? "text-error-primary font-medium" : "text-tertiary"}>
                          {formatDateTime(task.scheduled)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-tertiary text-xs">{formatDate(task.requested)}</td>
                      <td className="px-3 py-3 text-tertiary text-xs">{task.creator}</td>
                      <td className="px-3 py-3 max-w-[240px]">
                        <p className="text-xs text-tertiary truncate">{task.note}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Row count */}
          <p className="text-xs text-quaternary mt-3 px-1">
            {tab === "all" ? filteredAll.length : filteredScheduled.length} records
          </p>
        </div>
      </main>
    </div>
  );
}
