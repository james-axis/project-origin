import { Plus, X, Check, Settings01, Users01, List, RefreshCcw01, ChevronRight, Zap } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import { Settings } from "@/pages/settings";
import { useToast } from "@/components/toast";
import { ClientSlideout } from "@/components/client-slideout";
import { TaskPanel, type TaskPanelData } from "@/components/task-panels";
import { getPanelData, savePanelData } from "@/store/sim-store";
import {
  initSimStore, getLeads, addLead, getTasks, getOpenTasks,
  fireFirstTask, completeTask, attemptTask, resetSim,
  APPLICATION_CHAIN,
  type SimLead, type SimTask,
} from "@/store/sim-store";

// ─── Seed names for "Simulate client" button ───────────────────────────────────
const NEW_LEAD_POOL: Omit<SimLead, "id" | "createdAt">[] = [
  { firstName: "Tom",     lastName: "Patterson",  dob: "1983-06-12", email: "tom.patterson@email.com",  phone: "0411 222 333", policyType: "Life + TPD", practice: "LIP" },
  { firstName: "Natalie", lastName: "Brooks",     dob: "1990-02-27", email: "natalie.brooks@email.com", phone: "0422 333 444", policyType: "Life + Income Protection", practice: "Surehaven" },
  { firstName: "Marcus",  lastName: "Chen",       dob: "1977-10-08", email: "marcus.chen@email.com",    phone: "0433 444 555", policyType: "Life + Trauma", practice: "Tony Insurance" },
  { firstName: "Priya",   lastName: "Mehta",      dob: "1994-04-15", email: "priya.mehta@email.com",    phone: "0444 555 666", policyType: "Life only", practice: "Living Rich" },
  { firstName: "Daniel",  lastName: "Okafor",     dob: "1986-08-03", email: "daniel.okafor@email.com",  phone: "0455 666 777", policyType: "Life + TPD + Income Protection", practice: "LIP" },
];

const ROLE_COLORS: Record<string, string> = {
  Consultant:   "bg-brand-secondary text-brand-secondary",
  Admin:        "bg-secondary text-secondary",
  Services:     "bg-success-secondary text-success-primary",
  Compliance:   "bg-warning-secondary text-warning-primary",
  Manager:      "bg-secondary text-tertiary",
  "Task Master":"bg-[#EDE9FE] text-[#6D28D9]",
};

// ─── Task action modal ────────────────────────────────────────────────────────
function TaskActionModal({ task, lead, onClose, onAction, onToast, onOpenTask, onViewProfile }: {
  task: SimTask;
  lead: SimLead | undefined;
  onClose: () => void;
  onAction: () => void;
  onToast: (opts: import("@/components/toast").ToastOptions) => void;
  onOpenTask: (t: SimTask) => void;
  onViewProfile: (leadId: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState<{ type: "completed" | "attempted"; next: SimTask | null } | null>(null);
  const [panelData, setPanelData] = useState<TaskPanelData>(() => getPanelData(task.id));

  function handlePanelChange(data: TaskPanelData) {
    setPanelData(data);
    savePanelData(task.id, data);
  }

  const allTasks = getTasks().filter(t => t.leadId === task.leadId).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const isSubtask = !!task.parentTaskId;
  const chainStep = APPLICATION_CHAIN.findIndex(t => t.id === task.templateTaskId);
  const total = APPLICATION_CHAIN.length;

  function handleComplete() {
    setActing(true);
    const next = completeTask(task.id, notes);
    setResult({ type: "completed", next });
    if (next) {
      onToast({
        title: "Task completed",
        description: `Next up: ${next.name} → ${next.assigneeRole}`,
        variant: "success",
        actions: [
          { label: "Complete now", onClick: () => { onOpenTask(next); } },
          { label: "Dismiss", variant: "ghost", onClick: () => {} },
        ],
      });
    } else {
      onToast({ title: "🎉 Client is inforce!", description: `${lead?.firstName} ${lead?.lastName} — all tasks complete`, variant: "success", duration: 7000 });
    }
    setTimeout(() => { onAction(); onClose(); }, 1800);
  }

  function handleAttempted() {
    setActing(true);
    const next = attemptTask(task.id, notes);
    setResult({ type: "attempted", next });
    if (next) {
      onToast({
        title: "Task attempted",
        description: `Subtask created: ${next.name}`,
        variant: "warning",
        actions: [
          { label: "Complete now", onClick: () => { onOpenTask(next); } },
          { label: "Undo", variant: "ghost", onClick: () => { onOpenTask(task); } },
        ],
      });
    } else {
      onToast({ title: "Task attempted", description: "No subtasks configured for this task.", variant: "warning" });
    }
    setTimeout(() => { onAction(); onClose(); }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={!acting ? onClose : undefined} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between border-b border-secondary px-5 py-4">
          <div className="flex items-start gap-3">
            <div className={"flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold " + (ROLE_COLORS[task.assigneeRole] ?? "bg-secondary text-secondary")}>
              {isSubtask ? "↳" : chainStep + 1}
            </div>
            <div>
              <p className="text-base font-semibold text-primary">{task.name}</p>
              <p className="text-xs text-tertiary mt-0.5">
                {isSubtask ? "Subtask" : `Step ${chainStep + 1} of ${total}`} · {task.assigneeRole}
                {lead && <> · <span className="text-secondary">{lead.firstName} {lead.lastName}</span> · <button onClick={() => { onClose(); onViewProfile(task.leadId); }} className="text-brand-secondary hover:underline font-medium transition-colors">View profile</button></>}
              </p>
            </div>
          </div>
          {!acting && (
            <button onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {result ? (
          /* Result screen */
          <div className="flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
            {result.type === "completed" ? (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-success-secondary">
                  <Check className="size-6 text-success-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-semibold text-primary">Task completed</p>
                  {result.next
                    ? <p className="text-sm text-tertiary mt-1">Next up: <strong className="text-secondary">{result.next.name}</strong> ({result.next.assigneeRole})</p>
                    : <p className="text-sm text-tertiary mt-1">That's the last task — this lead is inforce. 🎉</p>
                  }
                </div>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-full bg-warning-secondary">
                  <RefreshCcw01 className="size-6 text-warning-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-base font-semibold text-primary">Task attempted</p>
                  {result.next
                    ? <p className="text-sm text-tertiary mt-1">Subtask created: <strong className="text-secondary">{result.next.name}</strong></p>
                    : <p className="text-sm text-tertiary mt-1">No subtasks configured for this task.</p>
                  }
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Lead info */}
            {lead && (
              <div className="mx-5 mt-4 rounded-xl border border-secondary bg-secondary_alt px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Client</p><p className="text-sm font-medium text-primary">{lead.firstName} {lead.lastName}</p></div>
                <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Policy type</p><p className="text-sm text-secondary">{lead.policyType}</p></div>
                <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Practice</p><p className="text-sm text-secondary">{lead.practice}</p></div>
                <div><p className="text-[10px] text-quaternary uppercase tracking-wider">DOB</p><p className="text-sm text-secondary">{lead.dob}</p></div>
              </div>
            )}

            {/* Task-specific panel */}
            {!task.parentTaskId && (
              <div className="mx-5 mt-4 rounded-xl border border-secondary bg-primary p-4">
                <TaskPanel
                  templateTaskId={task.templateTaskId}
                  lead={lead}
                  savedData={panelData}
                  onChange={handlePanelChange}
                />
              </div>
            )}

            {/* Task chain progress — always shows all 14 steps */}
            <div className="mx-5 mt-4 space-y-1">
              <p className="text-xs font-semibold text-quaternary uppercase tracking-wider mb-2">Task chain progress</p>
              <div className="flex gap-1">
                {APPLICATION_CHAIN.map((chainTask) => {
                  const instance = allTasks.find(t => t.templateTaskId === chainTask.id && !t.parentTaskId);
                  const isCurrent = instance?.id === task.id || (!instance && chainTask.id === task.templateTaskId);
                  const status = instance?.status;
                  return (
                    <div key={chainTask.id} title={`${chainTask.sortOrder + 1}. ${chainTask.name}`}
                      className={"h-1.5 flex-1 rounded-full " + (
                        status === "completed" ? "bg-success-solid" :
                        status === "attempted" ? "bg-warning-solid" :
                        isCurrent ? "bg-brand-solid" : "bg-tertiary opacity-30"
                      )} />
                  );
                })}
              </div>
              <p className="text-xs text-tertiary mt-1">
                {allTasks.filter(t => !t.parentTaskId && t.status === "completed").length} of {APPLICATION_CHAIN.length} tasks completed
              </p>
            </div>

            {/* Notes */}
            <div className="mx-5 mt-4 space-y-1.5">
              <label className="block text-sm font-medium text-secondary">Notes <span className="font-normal text-tertiary">(optional)</span></label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                placeholder="Add any notes about this interaction..." />
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-secondary mx-0 mt-4 px-5 py-4">
              <button onClick={handleAttempted}
                className="flex-1 rounded-lg border border-warning-solid bg-warning-secondary px-3 py-2.5 text-sm font-medium text-warning-primary hover:bg-warning-primary hover:text-white transition-colors">
                <span className="flex items-center justify-center gap-1.5"><RefreshCcw01 className="size-3.5" />Attempted</span>
              </button>
              <button onClick={handleComplete}
                className="flex-1 rounded-lg bg-success-solid px-3 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-colors">
                <span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" />Complete</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Simulate client modal ─────────────────────────────────────────────────────
function SimulateLeadModal({ open, onClose, onSimulated, onToast, onOpenTask }: { open: boolean; onClose: () => void; onSimulated: (lead: SimLead) => void; onToast: (opts: import("@/components/toast").ToastOptions) => void; onOpenTask: (task: SimTask) => void }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;
  const preview = NEW_LEAD_POOL[idx % NEW_LEAD_POOL.length];

  function fire() {
    const lead = addLead(preview);
    const firstTask = fireFirstTask(lead);
    setIdx(i => i + 1);
    onSimulated(lead);
    onClose();
    onToast({
      title: "New application",
      description: `${lead.firstName} ${lead.lastName} — ${lead.policyType} · Introduction Call ready`,
      variant: "info",
      duration: 6000,
      actions: [
        { label: "Open application", onClick: () => onOpenTask(firstTask) },
        { label: "Dismiss", variant: "ghost", onClick: () => {} },
      ],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-primary">Simulate new client</h3>
            <p className="text-sm text-tertiary mt-0.5">Creates a new client and fires Task 1</p>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-xl border border-secondary bg-secondary_alt p-4 grid grid-cols-2 gap-x-6 gap-y-2">
            <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Client</p><p className="text-sm font-semibold text-primary">{preview.firstName} {preview.lastName}</p></div>
            <div><p className="text-[10px] text-quaternary uppercase tracking-wider">DOB</p><p className="text-sm text-secondary">{preview.dob}</p></div>
            <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Policy</p><p className="text-sm text-secondary">{preview.policyType}</p></div>
            <div><p className="text-[10px] text-quaternary uppercase tracking-wider">Practice</p><p className="text-sm text-secondary">{preview.practice}</p></div>
            <div className="col-span-2"><p className="text-[10px] text-quaternary uppercase tracking-wider">Email</p><p className="text-sm text-secondary">{preview.email}</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-brand-secondary border border-brand px-3 py-2.5">
            <Zap className="size-4 text-brand-secondary shrink-0" />
            <p className="text-xs text-brand-secondary">Will fire: <strong>Introduction Call</strong> → assigned to you</p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={fire} className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
            <span className="flex items-center justify-center gap-1.5"><Zap className="size-3.5" />Simulate client</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Widget definitions ───────────────────────────────────────────────────────
const AVAILABLE_WIDGETS = [
  { id: "priorities",   label: "Next Best Action", description: "Next best actions to drive revenue" },
  { id: "universal_search",    label: "Universal Search",      description: "Filterable table across every client, task and status in the CRM" },
  { id: "tasks",        label: "Tasks",        description: "Open tasks across all clients" },
  { id: "leads",        label: "Clients",      description: "All active clients" },
  { id: "applications", label: "Applications", description: "In-progress applications by status" },
  { id: "compliance",   label: "Compliance",   description: "Items awaiting review" },
  { id: "claims",       label: "Claims",       description: "Open claims by status" },
  { id: "dishonours",   label: "Dishonours",   description: "Outstanding dishonours" },
  { id: "commissions",  label: "Commissions",  description: "This month vs last month" },
  { id: "payments",     label: "Payments",     description: "Recent payment activity" },
];

// ─── Beacon component — matches LIP dashboard exactly ────────────────────────
// 9px dot, box-shadow pulses outward 7px then fades — no separate ring element
type BeaconColor = "red" | "amber" | "green" | "blue";
const BEACON_BG: Record<BeaconColor, string> = {
  green: "rgb(18, 183, 106)",
  amber: "rgb(234, 179, 8)",
  red:   "rgb(180, 35, 24)",
  blue:  "rgb(211, 65, 8)",
};
function Beacon({ color = "green" }: { color?: BeaconColor }) {
  return (
    <span
      className={"inline-block shrink-0 rounded-full beacon-" + color}
      style={{ width: 9, height: 9, backgroundColor: BEACON_BG[color] }}
    />
  );
}

// ─── Task urgency helpers ─────────────────────────────────────────────────────
function getTaskAge(task: SimTask): number {
  return (Date.now() - new Date(task.createdAt).getTime()) / 60000; // minutes
}
function getTaskPriority(task: SimTask): "critical" | "high" | "normal" {
  const age = getTaskAge(task);
  if (task.status === "attempted" || age > 120) return "critical"; // overdue >2hrs or attempted
  if (age > 30) return "high";   // been sitting >30 min
  return "normal";
}
function getPriorityBeacon(p: "critical" | "high" | "normal"): BeaconColor {
  if (p === "critical") return "red";
  if (p === "high") return "amber";
  return "green";
}


// ─── Task row (shared) ────────────────────────────────────────────────────────
// ─── Tasks widget ─────────────────────────────────────────────────────────────
function TasksWidget({ onSelectTask }: { onSelectTask: (task: SimTask) => void }) {
  const [tasks, setTasks] = useState<SimTask[]>([]);
  const [leads, setLeads] = useState<SimLead[]>([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "overdue" | "amber" | "fresh">("all");

  const refresh = useCallback(() => {
    setTasks(getOpenTasks());
    setLeads(getLeads());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("axis_sim_update", handler);
    return () => window.removeEventListener("axis_sim_update", handler);
  }, [refresh]);

  const getLead = (id: string) => leads.find(l => l.id === id);

  // Split into priority (critical/high) and normal
  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-secondary_alt py-8 text-center gap-2">
        <List className="size-6 text-fg-quaternary" />
        <p className="text-xs text-tertiary">No open tasks — simulate a client to get started</p>
      </div>
    );
  }

  const overdueTasks = tasks.filter(t => getTaskPriority(t) === "critical");
  const freshTasks   = tasks.filter(t => getTaskPriority(t) === "normal");

  function downloadCSV() {
    const rows = [["Task", "Client", "Role", "Status", "Age (min)"]];
    tasks.forEach(t => {
      const l = getLead(t.leadId);
      rows.push([t.name, l ? `${l.firstName} ${l.lastName}` : "Unknown", t.assigneeRole, t.status, String(Math.round(getTaskAge(t)))]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "tasks.csv"; a.click();
  }

  const filtered = tasks.filter(t => {
    if (filter === "overdue" && getTaskPriority(t) !== "critical") return false;
    if (filter === "amber"   && getTaskPriority(t) !== "high")     return false;
    if (filter === "fresh"   && getTaskPriority(t) !== "normal")   return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) {
      const l = getLead(t.leadId);
      if (!l || !`${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">

      {/* ── Stat tiles — clickable to filter ── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {/* Total — clickable, sets filter to "all" */}
        <button onClick={() => setFilter("all")}
          className={"rounded-xl border px-3 py-3 text-left transition-all " + (filter === "all" ? "border-brand bg-brand-secondary ring-1 ring-inset border-brand" : "border-secondary bg-secondary_alt hover:border-brand")}>
          <p className="text-[10px] font-medium text-tertiary mb-1 truncate">Total</p>
          <p className="text-xl font-semibold text-primary">{tasks.length}</p>
        </button>
        {([
          { label: "Overdue", value: overdueTasks.length,                              filterKey: "overdue" as const, beacon: "red"   as BeaconColor, active: "border-[#EF4444] bg-[#FFF5F5]", inactive: "border-secondary bg-secondary_alt hover:border-[#FECACA]" },
          { label: "Near",    value: tasks.filter(t => getTaskPriority(t) === "high").length, filterKey: "amber"   as const, beacon: "amber" as BeaconColor, active: "border-[#F59E0B] bg-[#FFFBEB]", inactive: "border-secondary bg-secondary_alt hover:border-[#FDE68A]"  },
          { label: "New",     value: freshTasks.length,                                filterKey: "fresh"   as const, beacon: "green" as BeaconColor, active: "border-success-solid bg-success-secondary", inactive: "border-secondary bg-secondary_alt hover:border-success-solid" },
        ]).map(({ label, value, filterKey, beacon, active, inactive }) => {
          const isActive = filter === filterKey;
          return (
            <button key={label} onClick={() => setFilter(isActive ? "all" : filterKey)}
              className={"rounded-xl border px-3 py-3 text-left transition-all " + (isActive ? active + " ring-1 ring-inset " + active.split(" ")[0] : inactive)}>
              <div className="flex items-center gap-1.5 mb-1">
                <Beacon color={beacon} />
                <p className="text-[10px] font-medium text-tertiary truncate">{label}</p>
              </div>
              <p className={"text-xl font-semibold " + (beacon === "red" ? "text-[#B91C1C]" : beacon === "amber" ? "text-[#92400E]" : "text-success-primary")}>{value}</p>
            </button>
          );
        })}
      </div>

      {/* ── Search + download ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="size-3.5 text-fg-quaternary" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or clients..."
            className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand" />
        </div>
        {filter !== "all" && (
          <button onClick={() => setFilter("all")} className="flex items-center gap-1 rounded-lg border border-secondary bg-secondary px-2.5 py-1.5 text-[10px] font-semibold text-secondary hover:bg-secondary_alt transition-colors whitespace-nowrap">
            <X className="size-3" /> Clear
          </button>
        )}
        <button onClick={downloadCSV} title="Download CSV"
          className="flex size-7 items-center justify-center rounded-lg border border-secondary text-fg-quaternary hover:bg-secondary transition-colors shrink-0">
          <svg className="size-3.5" viewBox="0 0 16 16" fill="none"><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* ── Tile grid ── */}
      <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 300 }}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-xs text-tertiary rounded-xl border border-dashed border-secondary">No tasks match this filter</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(task => {
              const l = getLead(task.leadId);
              const p = getTaskPriority(task);
              const bc = getPriorityBeacon(p);
              const isSubtask = !!task.parentTaskId;
              const chainStep = APPLICATION_CHAIN.findIndex(t => t.id === task.templateTaskId);
              return (
                <button key={task.id} onClick={() => onSelectTask(task)}
                  className="group flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-3 text-left transition-all hover:border-brand hover:shadow-sm">
                  {/* Tile header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Beacon color={bc} />
                      <p className={"text-xs font-semibold truncate " + (p === "critical" ? "text-[#B91C1C]" : "text-primary")}>{task.name}</p>
                    </div>

                  </div>
                  {/* Tile meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={"flex size-5 items-center justify-center rounded-full text-[9px] font-bold " + (ROLE_COLORS[task.assigneeRole] ?? "bg-secondary text-secondary")}>
                        {l ? `${l.firstName[0]}${l.lastName[0]}` : "?"}
                      </div>
                      <span className="text-[10px] text-tertiary truncate max-w-[80px]">{l ? `${l.firstName} ${l.lastName}` : "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isSubtask
                        ? <span className="text-[10px] text-warning-primary font-medium">↳ subtask</span>
                        : <span className="text-[10px] text-quaternary">Step {chainStep + 1}/{APPLICATION_CHAIN.length}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Countdown timer (MM:SS from createdAt + 20 min) ──────────────────────────
function Countdown({ createdAt }: { createdAt: string }) {
  const endTime = new Date(createdAt).getTime() + 20 * 60 * 1000;
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      const r = Math.max(0, endTime - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [endTime, remaining]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isUrgent = remaining < 5 * 60 * 1000;
  if (remaining <= 0) return <span className="text-[10px] text-quaternary font-mono">expired</span>;
  return (
    <span className={"text-[10px] font-mono font-semibold tabular-nums " + (isUrgent ? "text-[#B91C1C]" : "text-tertiary")}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

// ─── Leads (Clients) widget ─────────────────────────────────────────────────────
function LeadsWidget({ onSelectClient }: { onSelectClient: (id: string) => void }) {
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [allTasks, setAllTasks] = useState<SimTask[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "complete">("all");
  const [showAllUrgent, setShowAllUrgent] = useState(false);

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setAllTasks(getTasks()); };
    refresh();
    window.addEventListener("axis_sim_update", refresh);
    return () => window.removeEventListener("axis_sim_update", refresh);
  }, []);

  const total = APPLICATION_CHAIN.length;

  function isNewLead(lead: SimLead) {
    return (Date.now() - new Date(lead.createdAt).getTime()) < 20 * 60 * 1000;
  }
  function hasOverdueTasks(leadId: string) {
    return allTasks.some(t => t.leadId === leadId && t.status === "open" && getTaskPriority(t) === "critical");
  }

  const attentionLeads = leads.filter(l => {
    if (!(isNewLead(l) || hasOverdueTasks(l.id))) return false;
    // Apply same search + status filters
    const lt = allTasks.filter(t => t.leadId === l.id);
    const open = lt.filter(t => t.status === "open").length;
    const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
    if (statusFilter === "active"   && open === 0) return false;
    if (statusFilter === "complete" && done < total) return false;
    if (search && !`${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) &&
        !l.policyType.toLowerCase().includes(search.toLowerCase()) &&
        !l.practice.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (leads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-secondary_alt py-8 text-center gap-2">
        <Users01 className="size-6 text-fg-quaternary" />
        <p className="text-xs text-tertiary">No clients yet — simulate a new client to get started</p>
      </div>
    );
  }

  function downloadCSV() {
    const rows = [["Name","Policy","Practice","Open Tasks","Progress"]];
    leads.forEach(l => {
      const lt = allTasks.filter(t => t.leadId === l.id);
      const open = lt.filter(t => t.status === "open").length;
      const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
      rows.push([`${l.firstName} ${l.lastName}`, l.policyType, l.practice, String(open), `${done}/${total}`]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "clients.csv"; a.click();
  }

  const filtered = leads.slice().reverse().filter(l => {
    const lt = allTasks.filter(t => t.leadId === l.id);
    const open = lt.filter(t => t.status === "open").length;
    const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
    if (statusFilter === "active"   && open === 0) return false;
    if (statusFilter === "complete" && done < total) return false;
    if (search && !`${l.firstName} ${l.lastName}`.toLowerCase().includes(search.toLowerCase()) &&
        !l.policyType.toLowerCase().includes(search.toLowerCase()) &&
        !l.practice.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const urgentLead = attentionLeads[0] ?? null;

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Search + download ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="size-3.5 text-fg-quaternary" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-secondary bg-primary pl-3 pr-7 py-1.5 text-xs text-primary outline-none focus:border-brand appearance-none cursor-pointer">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="complete">Complete</option>
          </select>
          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-fg-quaternary rotate-90 pointer-events-none" />
        </div>
        <button onClick={downloadCSV}
          className="flex size-7 items-center justify-center rounded-lg border border-secondary text-fg-quaternary hover:bg-secondary transition-colors shrink-0">
          <svg className="size-3.5" viewBox="0 0 16 16" fill="none"><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* ── URGENT section — one record at a time ── */}
      {urgentLead && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Urgent</span>
              <span className="rounded-full bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-semibold px-1.5 py-0.5">{attentionLeads.length}</span>
            </div>
            {attentionLeads.length > 1 && (
              <button onClick={() => setShowAllUrgent(v => !v)}
                className="text-[10px] text-brand-secondary hover:underline font-medium transition-colors">
                {showAllUrgent ? "Show less" : `View all ${attentionLeads.length}`}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {(showAllUrgent ? attentionLeads : [urgentLead]).map(lead => {
              const lt = allTasks.filter(t => t.leadId === lead.id);
              const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
              const pct = Math.round((done / total) * 100);
              const isNew = isNewLead(lead);
              const overdue = hasOverdueTasks(lead.id);
              return (
                <div key={lead.id} className="space-y-1.5">
                  <button onClick={() => onSelectClient(lead.id)}
                    className={"group flex flex-col gap-2 rounded-xl border p-3 text-left w-full transition-all hover:shadow-sm " +
                      (overdue
                        ? "border-secondary bg-gradient-to-br from-[#FFF5F5] via-[#FFF8F8] to-white"
                        : "border-secondary bg-gradient-to-br from-[#F0FDF4] via-[#F6FEF9] to-white")}>
                    <div className="flex items-center gap-2">
                      <Beacon color={overdue ? "red" : "green"} />
                      <div className={"flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                        (overdue ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-success-secondary text-success-primary")}>
                        {lead.firstName[0]}{lead.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-primary truncate">{lead.firstName} {lead.lastName}</p>
                          {overdue && <span className="shrink-0 rounded-full bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-semibold px-1.5 py-0.5">Overdue</span>}
                          {isNew && !overdue && <span className="shrink-0 rounded-full bg-success-secondary text-success-primary text-[10px] font-semibold px-1.5 py-0.5">New</span>}
                          {isNew && !overdue && <Countdown createdAt={lead.createdAt} />}
                        </div>
                        <p className="text-[10px] text-tertiary">{lead.policyType} · {lead.practice}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={"h-full rounded-full " + (overdue ? "bg-[#EF4444]" : "bg-success-solid")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-quaternary shrink-0">{done}/{total}</span>
                    </div>
                  </button>
                  {/* Divider between urgent items */}
                  {(showAllUrgent ? attentionLeads : [urgentLead]).indexOf(lead) < (showAllUrgent ? attentionLeads : [urgentLead]).length - 1 && (
                    <div className="h-px bg-secondary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Divider between urgent and all clients ── */}
      {urgentLead && filtered.length > 0 && (
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-secondary" />
          <span className="text-[10px] text-quaternary uppercase tracking-wider shrink-0">All clients</span>
          <div className="flex-1 h-px bg-secondary" />
        </div>
      )}

      {/* ── Client tiles ── */}
      <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 300 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl border border-dashed border-secondary">
            <Users01 className="size-5 text-fg-quaternary" />
            <p className="text-xs text-tertiary">No clients match</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(lead => {
              const lt = allTasks.filter(t => t.leadId === lead.id);
              const openCount = lt.filter(t => t.status === "open").length;
              const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
              const pct = Math.round((done / total) * 100);
              const isComplete = done === total;
              return (
                <button key={lead.id} onClick={() => onSelectClient(lead.id)}
                  className="group flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-3 text-left transition-all hover:border-brand hover:shadow-sm">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <div className={"flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                      (isComplete ? "bg-success-secondary text-success-primary" : "bg-brand-secondary text-brand-secondary")}>
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate group-hover:text-brand-secondary transition-colors">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[10px] text-tertiary truncate">{lead.practice}</p>
                    </div>
                    <span className={"inline-flex items-center gap-1 rounded-md border border-secondary px-1.5 py-0.5 text-[10px] font-medium " +
                      (isComplete ? "text-success-primary" : openCount > 0 ? "text-brand-secondary" : "text-tertiary")}>
                      {isComplete
                        ? <><span className="size-1.5 rounded-full bg-success-solid inline-block shrink-0" />Complete</>
                        : openCount > 0
                          ? <><span className="size-1.5 rounded-full bg-brand-solid inline-block shrink-0" />Active</>
                          : <><span className="size-1.5 rounded-full bg-tertiary inline-block shrink-0" />Pending</>}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={"h-full rounded-full transition-all " + (isComplete ? "bg-success-solid" : "bg-brand-solid")} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-quaternary">{done}/{total} tasks · {pct}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Next Best Action widget ─────────────────────────────────────────────────
// Surfaces the highest-impact actions across all clients using a priority score.
// Score model:
//   100 — Lapse Risk: late-stage task (step 9+) overdue >2hrs → revenue at risk
//    90 — New Arrival: client <20 min, first task open → window closing
//    70 — Stalled: any overdue task mid-chain → momentum lost
//    40 — Next Step: oldest open task, on track

type PriorityReason = "lapse_risk" | "new_arrival" | "stalled" | "next_step";

interface PriorityItem {
  score: number;
  reason: PriorityReason;
  lead: SimLead;
  task: SimTask;
  chainStep: number;
  ageMinutes: number;
}

const REASON_META: Record<PriorityReason, {
  label: string; bg: string; text: string; border: string;
  impact: string; beacon: BeaconColor;
}> = {
  lapse_risk: {
    label: "Lapse Risk",
    bg: "bg-[#FFF5F5]", text: "text-[#B91C1C]", border: "border-[#FECACA]",
    impact: "Policy at risk",
    beacon: "red",
  },
  new_arrival: {
    label: "New Arrival",
    bg: "bg-[#F0FDF4]", text: "text-success-primary", border: "border-success-solid",
    impact: "Strike while hot",
    beacon: "green",
  },
  stalled: {
    label: "Stalled",
    bg: "bg-[#FFFBEB]", text: "text-[#92400E]", border: "border-[#FDE68A]",
    impact: "Momentum at risk",
    beacon: "amber",
  },
  next_step: {
    label: "Next Step",
    bg: "bg-primary", text: "text-brand-secondary", border: "border-secondary",
    impact: "Keep moving",
    beacon: "blue",
  },
};

function buildPriorityQueue(leads: SimLead[], allTasks: SimTask[]): PriorityItem[] {
  const items: PriorityItem[] = [];

  leads.forEach(lead => {
    const openTasks = allTasks
      .filter(t => t.leadId === lead.id && t.status === "open" && !t.parentTaskId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (openTasks.length === 0) return;
    const task = openTasks[0];
    const chainStep = APPLICATION_CHAIN.findIndex(c => c.id === task.templateTaskId);
    const ageMinutes = (Date.now() - new Date(task.createdAt).getTime()) / 60000;
    const isNewClient = (Date.now() - new Date(lead.createdAt).getTime()) < 20 * 60 * 1000;

    let reason: PriorityReason;
    let score: number;

    if (chainStep >= 9 && ageMinutes > 120) {
      // Late-stage (Compliance+) and overdue — lapse risk
      reason = "lapse_risk";
      score = 100 + chainStep; // later stage = higher urgency
    } else if (isNewClient && chainStep === 0) {
      // Brand new, first task not touched yet
      reason = "new_arrival";
      score = 90 + Math.max(0, 20 - Math.floor(ageMinutes)); // fresher = higher
    } else if (ageMinutes > 120) {
      reason = "stalled";
      score = 70 + chainStep;
    } else {
      reason = "next_step";
      score = 40 - ageMinutes / 60; // older = slightly higher within this band
    }

    items.push({ score, reason, lead, task, chainStep, ageMinutes });
  });

  return items.sort((a, b) => b.score - a.score);
}

function PriorityCard({ item, onSelectTask, rank, isHero }: {
  item: PriorityItem;
  onSelectTask: (t: SimTask) => void;
  rank: number;
  isHero: boolean;
}) {
  const meta = REASON_META[item.reason];
  const age = item.ageMinutes < 1
    ? "Just now"
    : item.ageMinutes < 60
      ? `${Math.round(item.ageMinutes)}m ago`
      : `${Math.floor(item.ageMinutes / 60)}h ${Math.round(item.ageMinutes % 60)}m ago`;

  return (
    <button onClick={() => onSelectTask(item.task)}
      className={"group w-full text-left rounded-xl border p-4 transition-all hover:shadow-md " +
        (isHero ? meta.border + " " + meta.bg : "border-secondary bg-primary hover:border-brand")}>
      <div className="flex items-start gap-3">
        {/* Rank + beacon */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
          <span className={"text-[10px] font-bold tabular-nums " + (isHero ? meta.text : "text-quaternary")}>#{rank}</span>
          <Beacon color={meta.beacon} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold " +
              (isHero ? meta.text + " " + meta.bg + " border " + meta.border : "bg-secondary text-secondary")}>
              {meta.label}
            </span>
            <span className="text-[10px] text-quaternary">{age}</span>
          </div>

          {/* Client + action */}
          <div>
            <p className={"font-semibold truncate " + (isHero ? "text-sm text-primary" : "text-xs text-primary")}>
              {item.lead.firstName} {item.lead.lastName}
            </p>
            <p className={"text-tertiary truncate mt-0.5 " + (isHero ? "text-xs" : "text-[10px]")}>
              Step {item.chainStep + 1}: {item.task.name}
            </p>
            <p className={"font-medium mt-0.5 " + (isHero ? "text-xs " + meta.text : "text-[10px] text-quaternary")}>
              {meta.impact} · {item.lead.policyType}
            </p>
          </div>

          {/* Hero CTA */}
          {isHero && (
            <div className={"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors " +
              (item.reason === "lapse_risk" ? "bg-[#B91C1C] text-white group-hover:bg-[#991B1B]" :
               item.reason === "new_arrival" ? "bg-success-solid text-white group-hover:opacity-90" :
               item.reason === "stalled"     ? "bg-[#F59E0B] text-white group-hover:opacity-90" :
                                               "bg-brand-solid text-white group-hover:bg-brand-solid_hover")}>
              <Zap className="size-3" />Action now
            </div>
          )}
        </div>

        {/* Step progress pill */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={"text-[10px] font-mono font-semibold tabular-nums " + (isHero ? meta.text : "text-quaternary")}>
            {item.chainStep + 1}/{APPLICATION_CHAIN.length}
          </span>
          <div className="w-10 h-1 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-brand-solid"
              style={{ width: `${Math.round(((item.chainStep + 1) / APPLICATION_CHAIN.length) * 100)}%` }} />
          </div>
        </div>
      </div>
    </button>
  );
}

function TopPrioritiesWidget({ onSelectTask }: { onSelectTask: (t: SimTask) => void }) {
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [allTasks, setAllTasks] = useState<SimTask[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setAllTasks(getTasks()); };
    refresh();
    const handler = () => refresh();
    window.addEventListener("axis_sim_update", handler);
    return () => window.removeEventListener("axis_sim_update", handler);
  }, []);

  const queue = buildPriorityQueue(leads, allTasks);

  if (queue.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success-secondary">
          <Check className="size-6 text-success-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">All clear</p>
          <p className="text-xs text-tertiary mt-1">No priority actions right now — simulate a client to get started</p>
        </div>
      </div>
    );
  }

  const hero = queue[0];
  const rest = queue.slice(1, showAll ? undefined : 4);
  const hiddenCount = queue.length - 1 - (showAll ? queue.length - 1 : Math.min(4, queue.length - 1));

  // Summary counts
  const counts = { lapse_risk: 0, new_arrival: 0, stalled: 0, next_step: 0 };
  queue.forEach(i => counts[i.reason]++);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">

      {/* ── Summary bar ── */}
      <div className="flex items-center gap-3 px-1 flex-wrap">
        {(Object.entries(counts) as [PriorityReason, number][])
          .filter(([, v]) => v > 0)
          .map(([reason, count]) => {
            const m = REASON_META[reason];
            return (
              <div key={reason} className="flex items-center gap-1.5">
                <Beacon color={m.beacon} />
                <span className={"text-[10px] font-semibold " + m.text}>{count} {m.label}</span>
              </div>
            );
          })}
        <span className="ml-auto text-[10px] text-quaternary">{queue.length} action{queue.length !== 1 ? "s" : ""} queued</span>
      </div>

      {/* ── Hero: #1 action ── */}
      <PriorityCard item={hero} onSelectTask={onSelectTask} rank={1} isHero />

      {/* ── Divider ── */}
      {rest.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-secondary" />
          <span className="text-[10px] text-quaternary uppercase tracking-wider shrink-0">Up next</span>
          <div className="flex-1 h-px bg-secondary" />
        </div>
      )}

      {/* ── Queue ── */}
      <div className="overflow-y-auto flex-1 min-h-0 space-y-2" style={{ maxHeight: 280 }}>
        {rest.map((item, i) => (
          <PriorityCard key={item.task.id} item={item} onSelectTask={onSelectTask} rank={i + 2} isHero={false} />
        ))}
        {hiddenCount > 0 && (
          <button onClick={() => setShowAll(true)}
            className="w-full rounded-xl border border-dashed border-secondary py-2.5 text-xs font-medium text-tertiary hover:text-secondary hover:border-primary transition-colors">
            Show {hiddenCount} more action{hiddenCount !== 1 ? "s" : ""}
          </button>
        )}
        {showAll && queue.length > 5 && (
          <button onClick={() => setShowAll(false)}
            className="w-full rounded-xl border border-dashed border-secondary py-2.5 text-xs font-medium text-tertiary hover:text-secondary hover:border-primary transition-colors">
            Show less
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Applications widget ────────────────────────────────────────────────────
// An "application" = one client + their Application task chain.
// Status is derived from where they are in the 14-task chain.
function ApplicationsWidget({ onSelectTask, onSelectClient }: {
  onSelectTask: (t: SimTask) => void;
  onSelectClient: (id: string) => void;
}) {
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [allTasks, setAllTasks] = useState<SimTask[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "active" | "overdue" | "complete">("all");
  const [showAllUrgent, setShowAllUrgent] = useState(false);

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setAllTasks(getTasks()); };
    refresh();
    window.addEventListener("axis_sim_update", refresh);
    return () => window.removeEventListener("axis_sim_update", refresh);
  }, []);

  const total = APPLICATION_CHAIN.length;

  function isNewApp(lead: SimLead) {
    return (Date.now() - new Date(lead.createdAt).getTime()) < 20 * 60 * 1000;
  }
  function getAppStatus(leadId: string): "new" | "overdue" | "active" | "complete" {
    const lt = allTasks.filter(t => t.leadId === leadId);
    const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
    if (done >= total) return "complete";
    const open = lt.filter(t => t.status === "open");
    if (open.some(t => getTaskPriority(t) === "critical")) return "overdue";
    const lead = leads.find(l => l.id === leadId);
    if (lead && isNewApp(lead)) return "new";
    return "active";
  }
  function getCurrentTask(leadId: string): SimTask | undefined {
    return allTasks.filter(t => t.leadId === leadId && t.status === "open" && !t.parentTaskId)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
  }

  function matchesSearch(lead: SimLead) {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(q) ||
      lead.policyType.toLowerCase().includes(q) ||
      lead.practice.toLowerCase().includes(q);
  }
  function matchesStatusFilter(lead: SimLead) {
    if (statusFilter === "all") return true;
    return getAppStatus(lead.id) === statusFilter;
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-secondary_alt py-8 text-center gap-2">
        <List className="size-6 text-fg-quaternary" />
        <p className="text-xs text-tertiary">No applications yet — simulate a client to get started</p>
      </div>
    );
  }

  const urgentApps = leads.filter(l => {
    const s = getAppStatus(l.id);
    if (s !== "new" && s !== "overdue") return false;
    return matchesSearch(l) && matchesStatusFilter(l);
  });
  const urgentApp = urgentApps[0] ?? null;
  const filtered = leads.slice().reverse().filter(l => matchesSearch(l) && matchesStatusFilter(l));
  const newCount      = leads.filter(l => getAppStatus(l.id) === "new").length;
  const overdueCount  = leads.filter(l => getAppStatus(l.id) === "overdue").length;
  const activeCount   = leads.filter(l => getAppStatus(l.id) === "active").length;
  const completeCount = leads.filter(l => getAppStatus(l.id) === "complete").length;

  function downloadCSV() {
    const rows = [["Client","Policy","Practice","Status","Progress","Current Task"]];
    leads.forEach(l => {
      const lt = allTasks.filter(t => t.leadId === l.id);
      const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
      const ct = getCurrentTask(l.id);
      rows.push([`${l.firstName} ${l.lastName}`, l.policyType, l.practice, getAppStatus(l.id), `${done}/${total}`, ct?.name ?? "—"]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "applications.csv"; a.click();
  }

  const APP_STATUS_STYLE: Record<string, string> = {
    new:      "bg-success-secondary text-success-primary",
    overdue:  "bg-[#FEE2E2] text-[#B91C1C]",
    active:   "bg-brand-secondary text-brand-secondary",
    complete: "bg-[#ECFDF5] text-[#059669]",
  };
  const APP_STATUS_DOT: Record<string, string> = {
    new: "bg-success-solid", overdue: "bg-[#EF4444]", active: "bg-brand-solid", complete: "bg-success-solid",
  };
  const APP_STATUS_LABEL: Record<string, string> = {
    new: "New", overdue: "Overdue", active: "Active", complete: "Complete",
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {([
          { label: "New",      value: newCount,      filterKey: "new"      as const, beacon: "green" as BeaconColor },
          { label: "Overdue",  value: overdueCount,  filterKey: "overdue"  as const, beacon: "red"   as BeaconColor },
          { label: "Active",   value: activeCount,   filterKey: "active"   as const, beacon: "amber" as BeaconColor },
          { label: "Complete", value: completeCount, filterKey: "complete" as const, beacon: undefined },
        ]).map(({ label, value, filterKey, beacon }) => {
          const isActive = statusFilter === filterKey;
          return (
            <button key={label} onClick={() => setStatusFilter(isActive ? "all" : filterKey)}
              className={"rounded-xl border px-3 py-2.5 text-left transition-all " +
                (isActive
                  ? (filterKey === "overdue" ? "border-[#EF4444] bg-[#FFF5F5]" :
                     filterKey === "new"     ? "border-success-solid bg-success-secondary" :
                     filterKey === "active"  ? "border-brand bg-brand-secondary" :
                                               "border-success-solid bg-success-secondary")
                  : "border-secondary bg-secondary_alt hover:border-primary")}>
              <div className="flex items-center gap-1.5 mb-1">
                {beacon && <Beacon color={beacon} />}
                <p className="text-[10px] font-medium text-tertiary truncate">{label}</p>
              </div>
              <p className={"text-xl font-semibold " +
                (filterKey === "overdue" ? "text-[#B91C1C]" :
                 filterKey === "new"     ? "text-success-primary" :
                 filterKey === "active"  ? "text-brand-secondary" : "text-primary")}>{value}</p>
            </button>
          );
        })}
      </div>

      {/* ── Search + filter + download ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications..."
            className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-secondary bg-primary pl-3 pr-7 py-1.5 text-xs text-primary outline-none focus:border-brand appearance-none cursor-pointer">
            <option value="all">All</option><option value="new">New</option>
            <option value="overdue">Overdue</option><option value="active">Active</option><option value="complete">Complete</option>
          </select>
          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-fg-quaternary rotate-90 pointer-events-none" />
        </div>
        <button onClick={downloadCSV} className="flex size-7 items-center justify-center rounded-lg border border-secondary text-fg-quaternary hover:bg-secondary transition-colors shrink-0">
          <svg className="size-3.5" viewBox="0 0 16 16" fill="none"><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 2v8M5 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* ── URGENT section ── */}
      {urgentApp && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Urgent</span>
              <span className="rounded-full bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-semibold px-1.5 py-0.5">{urgentApps.length}</span>
            </div>
            {urgentApps.length > 1 && (
              <button onClick={() => setShowAllUrgent(v => !v)} className="text-[10px] text-brand-secondary hover:underline font-medium">
                {showAllUrgent ? "Show less" : `View all ${urgentApps.length}`}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {(showAllUrgent ? urgentApps : [urgentApp]).map((lead) => {
              const lt = allTasks.filter(t => t.leadId === lead.id);
              const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
              const pct = Math.round((done / total) * 100);
              const appStatus = getAppStatus(lead.id);
              const ct = getCurrentTask(lead.id);
              return (
                <button key={lead.id} onClick={() => ct ? onSelectTask(ct) : onSelectClient(lead.id)}
                  className={"group flex flex-col gap-2 rounded-xl border p-3 text-left w-full transition-all hover:shadow-sm " +
                    (appStatus === "overdue"
                      ? "border-secondary bg-gradient-to-br from-[#FFF5F5] via-[#FFF8F8] to-white"
                      : "border-secondary bg-gradient-to-br from-[#F0FDF4] via-[#F6FEF9] to-white")}>
                  <div className="flex items-center gap-2">
                    <Beacon color={appStatus === "overdue" ? "red" : "green"} />
                    <div className={"flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " +
                      (appStatus === "overdue" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-success-secondary text-success-primary")}>
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[10px] text-tertiary">{ct?.name ?? "Complete"}</p>
                    </div>
                    <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 " + APP_STATUS_STYLE[appStatus]}>{APP_STATUS_LABEL[appStatus]}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-brand-solid" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-quaternary tabular-nums">{done}/{total}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="h-px bg-secondary mt-3 mb-2" />
        </div>
      )}

      {/* ── All applications ── */}
      <div className="overflow-y-auto flex-1 min-h-0 space-y-2" style={{ maxHeight: 300 }}>
        {filtered.map(lead => {
          const lt = allTasks.filter(t => t.leadId === lead.id);
          const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
          const pct = Math.round((done / total) * 100);
          const appStatus = getAppStatus(lead.id);
          const ct = getCurrentTask(lead.id);
          return (
            <button key={lead.id} onClick={() => ct ? onSelectTask(ct) : onSelectClient(lead.id)}
              className="group flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-3 text-left w-full transition-all hover:border-brand hover:shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">{lead.firstName} {lead.lastName}</p>
                  <p className="text-[10px] text-tertiary truncate">{ct ? `Step ${APPLICATION_CHAIN.findIndex(c => c.id === ct.templateTaskId) + 1}: ${ct.name}` : "Complete"}</p>
                </div>
                <span className={"text-[10px] font-semibold rounded-full px-2 py-0.5 " + APP_STATUS_STYLE[appStatus]}>
                  <span className={"inline-block size-1.5 rounded-full mr-1 " + APP_STATUS_DOT[appStatus]} />{APP_STATUS_LABEL[appStatus]}
                </span>
              </div>
              <div className="flex items-center gap-2 pl-9">
                <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-brand-solid" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-quaternary tabular-nums">{done}/{total}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Universal Search widget ──────────────────────────────────────────────────
function CRMTableWidget({ onSelectTask, onSelectClient, globalTileFilter }: {
  onSelectTask: (t: SimTask) => void;
  onSelectClient: (id: string) => void;
  globalTileFilter: GlobalTile | null;
}) {
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [allTasks, setAllTasks] = useState<SimTask[]>([]);
  const [filters, setFilters] = useState<CRMFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savePresetName, setSavePresetName] = useState("");
  const { presets, add: addPreset, remove: removePreset } = usePresetsStore();

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setAllTasks(getTasks()); };
    refresh();
    window.addEventListener("axis_sim_update", refresh);
    return () => window.removeEventListener("axis_sim_update", refresh);
  }, []);

  const total = APPLICATION_CHAIN.length;
  const allRows = buildTableRows(leads, allTasks, total);

  const totalCount   = allRows.length;
  const overdueCount = allRows.filter(r => r.priority === "critical").length;
  const amberCount   = allRows.filter(r => r.priority === "high").length;
  const freshCount   = allRows.filter(r => r.priority === "normal" && r.appStatus !== "complete").length;

  const cutoff = (days: number) => Date.now() - days * 24 * 60 * 60 * 1000;
  const filtered2 = allRows.filter(row => {
    const { lead, priority, appStatus } = row;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!`${lead.firstName} ${lead.lastName} ${lead.policyType} ${lead.practice}`.toLowerCase().includes(q)) return false;
    }
    if (filters.dateRange !== "all") {
      const days = filters.dateRange === "7d" ? 7 : filters.dateRange === "30d" ? 30 : 90;
      if (new Date(lead.createdAt).getTime() < cutoff(days)) return false;
    }
    if (filters.appStatus.length > 0 && !filters.appStatus.includes(appStatus as any)) return false;
    if (filters.taskPriority.length > 0 && !filters.taskPriority.includes(priority as any)) return false;
    if (filters.practice && lead.practice !== filters.practice) return false;
    if (filters.policyType && !lead.policyType.includes(filters.policyType)) return false;
    const effectiveTile = globalTileFilter ?? filters.tileFilter;
    if (effectiveTile === "overdue" && priority !== "critical") return false;
    if (effectiveTile === "amber"   && priority !== "high")     return false;
    if (effectiveTile === "fresh"   && priority !== "normal")   return false;
    return true;
  });

  const sorted = [...filtered2].sort((a, b) => {
    let va: any, vb: any;
    switch (sortKey) {
      case "name":       va = `${a.lead.firstName} ${a.lead.lastName}`; vb = `${b.lead.firstName} ${b.lead.lastName}`; break;
      case "policyType": va = a.lead.policyType; vb = b.lead.policyType; break;
      case "practice":   va = a.lead.practice;   vb = b.lead.practice;   break;
      case "appStatus":  va = a.appStatus;        vb = b.appStatus;        break;
      case "step":       va = a.chainStep;        vb = b.chainStep;        break;
      case "priority": { const p = { critical: 3, high: 2, normal: 1 } as Record<string, number>; va = p[a.priority] ?? 0; vb = p[b.priority] ?? 0; break; }
      case "age":        va = a.ageMinutes;  vb = b.ageMinutes;  break;
      case "progress":   va = a.progress;    vb = b.progress;    break;
    }
    const cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
    return sortDir === "asc" ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function clearFilters() { setFilters(DEFAULT_FILTERS); }
  function applyPreset(p: CRMPreset) { setFilters(p.filters); }

  const hasActiveFilters = !!(filters.search || filters.dateRange !== "all" || filters.appStatus.length > 0 ||
    filters.taskPriority.length > 0 || filters.practice || filters.policyType || filters.tileFilter || globalTileFilter);

  const practices = [...new Set(leads.map(l => l.practice))];

  const APP_STATUS_STYLE: Record<string, string> = {
    new: "bg-success-secondary text-success-primary", active: "bg-brand-secondary text-brand-secondary",
    overdue: "bg-[#FEE2E2] text-[#B91C1C]", complete: "bg-[#ECFDF5] text-[#059669]",
  };
  const PRIORITY_STYLE: Record<string, { label: string; dot: string }> = {
    critical: { label: "Overdue", dot: "bg-[#EF4444]" },
    high:     { label: "Amber",   dot: "bg-[#F59E0B]" },
    normal:   { label: "Fresh",   dot: "bg-[#22C55E]" },
  };

  const SortTh = ({ k, label, className = "" }: { k: SortKey; label: string; className?: string }) => (
    <th onClick={() => toggleSort(k)}
      className={"cursor-pointer select-none px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-quaternary hover:text-tertiary whitespace-nowrap " + className}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k ? (
          <svg className="size-2.5" viewBox="0 0 10 10" fill="currentColor">
            {sortDir === "asc" ? <path d="M5 2l4 6H1z" /> : <path d="M5 8L1 2h8z" />}
          </svg>
        ) : <svg className="size-2.5 opacity-30" viewBox="0 0 10 10" fill="currentColor"><path d="M5 2l4 6H1z" opacity="0.5"/><path d="M5 8L1 2h8z" opacity="0.5"/></svg>}
      </span>
    </th>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-0">
      {/* ── Preset pills + filter toggle ── */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1 min-w-0 pb-0.5">
          {presets.length === 0 && (
            <span className="text-[10px] text-quaternary italic shrink-0">No saved presets yet</span>
          )}
          {presets.map(p => (
            <div key={p.id} className="group relative shrink-0 flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all hover:shadow-sm cursor-pointer"
              style={{ borderColor: p.color + "66", backgroundColor: p.color + "15", color: p.color }}
              onClick={() => applyPreset(p)}>
              {p.name}
              <button onClick={e => { e.stopPropagation(); removePreset(p.id); }}
                className="ml-1.5 hidden group-hover:inline-flex size-3.5 items-center justify-center rounded-full hover:bg-black/10">
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="text-[10px] font-medium text-[#D34108] hover:underline whitespace-nowrap">Clear filters</button>
          )}
          <button onClick={() => setSaveModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-secondary bg-white px-2.5 py-1.5 text-[10px] font-medium text-secondary hover:border-primary hover:bg-secondary transition-colors whitespace-nowrap">
            <svg className="size-3" viewBox="0 0 16 16" fill="none"><path d="M13 2H4l-1 1v10l1 1h9l1-1V4l-1-2zm-3 11H6V9h4v4zm2 0h-1V9H5V8h6v5h1V3H4v1h8v9zM6 3h4v2H6V3z" fill="currentColor"/></svg>
            Save preset
          </button>
          <button onClick={() => setFiltersOpen(f => !f)}
            className={"inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium transition-colors whitespace-nowrap " +
              (filtersOpen ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-white text-secondary hover:border-primary")}>
            <svg className="size-3" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Filters {hasActiveFilters && <span className="inline-flex size-4 items-center justify-center rounded-full bg-brand-solid text-white text-[9px] font-bold">!</span>}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <div className="mb-3 rounded-xl border border-secondary bg-[#FAFAFA] p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <label className="block text-[10px] font-semibold text-quaternary uppercase tracking-wider mb-1">Search</label>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-quaternary" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Name, policy, practice..."
                className="w-full rounded-lg border border-secondary bg-white pl-7 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand" />
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-[10px] font-semibold text-quaternary uppercase tracking-wider mb-1">Date range</label>
            <div className="relative">
              <select value={filters.dateRange} onChange={e => setFilters(f => ({ ...f, dateRange: e.target.value as any }))}
                className="w-full rounded-lg border border-secondary bg-white px-2.5 py-1.5 text-xs text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* App status */}
          <div>
            <label className="block text-[10px] font-semibold text-quaternary uppercase tracking-wider mb-1">App status</label>
            <div className="flex flex-col gap-0.5">
              {(["new","active","overdue","complete"] as const).map(s => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={filters.appStatus.includes(s)}
                    onChange={e => setFilters(f => ({ ...f, appStatus: e.target.checked ? [...f.appStatus, s] : f.appStatus.filter(x => x !== s) }))}
                    className="rounded border-secondary size-3 accent-[#D34108]" />
                  <span className="text-[10px] text-secondary capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Task priority */}
          <div>
            <label className="block text-[10px] font-semibold text-quaternary uppercase tracking-wider mb-1">Priority</label>
            <div className="flex flex-col gap-0.5">
              {([["critical","Overdue"],["high","Amber"],["normal","Fresh"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={filters.taskPriority.includes(v)}
                    onChange={e => setFilters(f => ({ ...f, taskPriority: e.target.checked ? [...f.taskPriority, v] : f.taskPriority.filter(x => x !== v) }))}
                    className="rounded border-secondary size-3 accent-[#D34108]" />
                  <span className="text-[10px] text-secondary">{l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Practice */}
          <div>
            <label className="block text-[10px] font-semibold text-quaternary uppercase tracking-wider mb-1">Practice</label>
            <div className="relative">
              <select value={filters.practice} onChange={e => setFilters(f => ({ ...f, practice: e.target.value }))}
                className="w-full rounded-lg border border-secondary bg-white px-2.5 py-1.5 text-xs text-primary outline-none focus:border-brand appearance-none cursor-pointer">
                <option value="">All practices</option>
                {practices.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-secondary">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <svg className="size-8 text-fg-quaternary" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/><path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <p className="text-sm font-semibold text-secondary">No records match</p>
            <p className="text-xs text-quaternary">Try adjusting your filters</p>
            <button onClick={clearFilters} className="text-xs font-medium text-[#D34108] hover:underline">Clear all filters</button>
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[#F8F9FB] border-b border-secondary">
              <tr>
                <SortTh k="name"       label="Client"      className="pl-4" />
                <SortTh k="policyType" label="Policy" />
                <SortTh k="practice"   label="Practice" />
                <SortTh k="appStatus"  label="Status" />
                <SortTh k="step"       label="Current task" />
                <SortTh k="priority"   label="Priority" />
                <SortTh k="age"        label="Age" />
                <SortTh k="progress"   label="Progress"    className="pr-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary bg-white">
              {sorted.map(row => {
                const { lead, currentTask, chainStep, ageMinutes, priority, appStatus, completedCount, progress } = row;
                const ageStr = ageMinutes < 1 ? "Just now" : ageMinutes < 60 ? `${Math.round(ageMinutes)}m` : `${Math.floor(ageMinutes / 60)}h ${Math.round(ageMinutes % 60)}m`;
                const priMeta = PRIORITY_STYLE[priority];
                return (
                  <tr key={lead.id}
                    onClick={() => currentTask ? onSelectTask(currentTask) : onSelectClient(lead.id)}
                    className="hover:bg-[#FFF8F5] cursor-pointer transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 flex size-7 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary group-hover:bg-brand-secondary group-hover:text-brand-secondary">
                          {lead.firstName[0]}{lead.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-primary truncate max-w-[120px]">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[10px] text-quaternary truncate max-w-[120px]">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-secondary truncate block max-w-[120px]">{lead.policyType}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-secondary truncate block max-w-[90px]">{lead.practice}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize " + APP_STATUS_STYLE[appStatus]}>
                        {appStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {currentTask ? (
                        <div className="min-w-0">
                          <p className="text-secondary font-medium truncate max-w-[140px]">{currentTask.name}</p>
                          <p className="text-[10px] text-quaternary">Step {chainStep + 1}/{total}</p>
                        </div>
                      ) : (
                        <span className="text-quaternary italic">Complete</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1">
                        <span className={"size-1.5 rounded-full shrink-0 " + priMeta.dot} />
                        <span className="text-secondary">{priMeta.label}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-secondary tabular-nums">{currentTask ? ageStr : "—"}</td>
                    <td className="px-3 py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={"h-full rounded-full transition-all " + (progress >= 100 ? "bg-success-solid" : "bg-brand-solid")}
                            style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-quaternary tabular-nums whitespace-nowrap">{completedCount}/{total}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Row count ── */}
      <div className="mt-2 flex items-center justify-between px-1">
        <p className="text-[10px] text-quaternary">{sorted.length} of {totalCount} record{totalCount !== 1 ? "s" : ""}</p>
        {hasActiveFilters && (
          <p className="text-[10px] text-[#D34108] font-medium">{totalCount - sorted.length} filtered out</p>
        )}
      </div>

      {/* ── Save preset modal ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={() => setSaveModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-secondary bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
              <h3 className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Save filter preset</h3>
              <button onClick={() => setSaveModalOpen(false)} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Preset name</label>
                <input value={savePresetName} onChange={e => setSavePresetName(e.target.value)}
                  autoFocus placeholder="e.g. Overdue this week"
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand" />
              </div>
              <p className="text-xs text-quaternary">This will save all current active filters as a one-click preset.</p>
            </div>
            <div className="flex gap-2 border-t border-secondary px-5 py-4">
              <button onClick={() => setSaveModalOpen(false)}
                className="flex-1 rounded-lg border border-secondary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
              <button disabled={!savePresetName.trim()}
                onClick={() => {
                  if (!savePresetName.trim()) return;
                  addPreset({
                    id: Date.now().toString(),
                    name: savePresetName.trim(),
                    filters: { ...filters },
                    color: PRESET_COLORS[presets.length % PRESET_COLORS.length],
                  });
                  setSavePresetName("");
                  setSaveModalOpen(false);
                }}
                className="flex-1 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50 transition-colors">
                <span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" />Save preset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetContent({ id, onSelectTask, onSelectClient, globalTileFilter }: { id: string; onSelectTask: (t: SimTask) => void; onSelectClient: (id: string) => void; globalTileFilter?: GlobalTile | null }) {
  const w = AVAILABLE_WIDGETS.find(w => w.id === id);
  if (id === "tasks")        return <TasksWidget onSelectTask={onSelectTask} />;
  if (id === "leads")        return <LeadsWidget onSelectClient={onSelectClient} />;
  if (id === "applications") return <ApplicationsWidget onSelectTask={onSelectTask} onSelectClient={onSelectClient} />;
  if (id === "priorities")    return <TopPrioritiesWidget onSelectTask={onSelectTask} />;
  if (id === "universal_search")     return <CRMTableWidget onSelectTask={onSelectTask} onSelectClient={onSelectClient} globalTileFilter={globalTileFilter ?? null} />;
  return <PlaceholderWidget description={w?.description ?? ""} />;
}

// ─── Widget card ──────────────────────────────────────────────────────────────
const WIDGET_STYLES: Record<string, { header: string; card: string }> = {
  priorities:   { card: "bg-primary border border-secondary shadow-sm",        header: "text-primary" },
  universal_search: { card: "bg-primary border border-secondary shadow-sm",    header: "text-primary" },
  tasks:        { card: "bg-primary border border-secondary shadow-sm",        header: "text-primary" },
  leads:        { card: "bg-primary border border-secondary shadow-sm",        header: "text-primary" },
  applications: { card: "bg-primary border border-secondary shadow-sm",        header: "text-primary" },
  default:      { card: "bg-primary border border-secondary shadow-sm",        header: "text-primary" },
};

const WidgetCard = ({ id, label, onRemove, onSelectTask, onSelectClient }: { id: string; label: string; onRemove: () => void; onSelectTask: (t: SimTask) => void; onSelectClient: (id: string) => void }) => {
  const styles = WIDGET_STYLES[id] ?? WIDGET_STYLES.default;
  return (
    <div className={"flex flex-col rounded-2xl p-5 " + styles.card} style={{ minHeight: 480 }}>
      <div className="flex items-center justify-between mb-4">
        <p className={"text-base font-semibold " + styles.header} style={{ fontFamily: "'Metrophobic', sans-serif" }}>{label}</p>
        <button onClick={onRemove} className="text-xs text-quaternary hover:text-secondary transition-colors px-2 py-1 rounded hover:bg-secondary">Remove</button>
      </div>
      <WidgetContent id={id} onSelectTask={onSelectTask} onSelectClient={onSelectClient} />
    </div>
  );
};

const EmptySlot = ({ onAdd }: { onAdd: () => void }) => (
  <button onClick={onAdd} className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-secondary bg-primary p-8 text-center transition hover:border-brand hover:bg-brand-secondary cursor-pointer min-h-64">
    <div className="flex size-10 items-center justify-center rounded-full border border-secondary bg-primary shadow-xs group-hover:border-brand group-hover:bg-primary">
      <Plus className="size-5 text-fg-quaternary group-hover:text-brand-secondary" />
    </div>
    <div>
      <p className="text-sm font-semibold text-secondary group-hover:text-brand-secondary">Add widget</p>
      <p className="text-xs text-quaternary mt-0.5">Choose a module to display here</p>
    </div>
  </button>
);

// ─── Add widget modal ─────────────────────────────────────────────────────────
const AddWidgetModal = ({ open, onClose, onAdd, existingWidgets }: { open: boolean; onClose: () => void; onAdd: (id: string) => void; existingWidgets: string[] }) => {
  if (!open) return null;
  const available = AVAILABLE_WIDGETS.filter(w => !existingWidgets.includes(w.id));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
          <h2 className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Add widget</h2>
          <button onClick={onClose} className="text-sm text-quaternary hover:text-secondary transition">Close</button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {available.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-quaternary py-8">All widgets added</p>
          ) : available.map(w => (
            <button key={w.id} onClick={() => { onAdd(w.id); onClose(); }}
              className="flex flex-col gap-1 rounded-xl border border-secondary bg-primary p-4 text-left hover:border-brand hover:bg-brand-secondary transition">
              <p className="text-sm font-semibold text-primary">{w.label}</p>
              <p className="text-xs text-quaternary">{w.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Rename tab modal ─────────────────────────────────────────────────────────
const RenameTabModal = ({ open, current, onSave, onClose }: { open: boolean; current: string; onSave: (name: string) => void; onClose: () => void }) => {
  const [value, setValue] = useState(current);
  useEffect(() => { if (open) setValue(current); }, [open, current]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <h3 className="text-base font-medium text-primary">Rename tab</h3>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-4">
          <input value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && value.trim() && (onSave(value.trim()), onClose())}
            autoFocus className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); }}} disabled={!value.trim()}
            className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50 transition-colors">
            <span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" />Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Mini SVG bar chart ──────────────────────────────────────────────────────
function BarChart({ values, color = "#D34108", height = 36 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1);
  const w = 80; const barW = Math.floor(w / values.length) - 2;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: w, height }} className="overflow-visible">
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * (height - 4));
        const x = i * (barW + 2);
        const isLast = i === values.length - 1;
        return (
          <rect key={i} x={x} y={height - bh} width={barW} height={bh} rx="2"
            fill={isLast ? color : color + "55"} />
        );
      })}
    </svg>
  );
}

// ─── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ pct, color = "#D34108", size = 56 }: { pct: number; color?: string; size?: number }) {
  const r = 22; const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#F5F5F5" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${c}`} strokeDashoffset={c * 0.25}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x="28" y="33" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="Metrophobic, sans-serif">{pct}%</text>
    </svg>
  );
}

// ─── Workbench Hero ───────────────────────────────────────────────────────────
function WorkbenchHero({ leads, allTasks }: { leads: SimLead[]; allTasks: SimTask[] }) {
  const total = APPLICATION_CHAIN.length;
  const inforceCount  = leads.filter(l => allTasks.filter(t => t.leadId === l.id && t.status === "completed" && !t.parentTaskId).length >= total).length;
  const activeCount   = leads.filter(l => allTasks.some(t => t.leadId === l.id && t.status === "open")).length;
  const overdueCount  = leads.filter(l => allTasks.some(t => t.leadId === l.id && t.status === "open" && getTaskPriority(t) === "critical")).length;
  const completedTasks = allTasks.filter(t => t.status === "completed" && !t.parentTaskId).length;
  const totalTasks     = allTasks.filter(t => !t.parentTaskId).length;
  const completionPct  = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Simulated 7-day bars — seeded from actual data so they update as sim progresses
  const taskBars = [2, 4, 3, 6, 5, 3, Math.max(1, completedTasks)];
  const clientBars = [1, 2, 1, 3, 2, 4, Math.max(1, leads.length)];

  // Achievement tier
  const tier = inforceCount >= 10 ? { label: "Platinum", icon: "💎", color: "#8B5CF6" }
             : inforceCount >= 5  ? { label: "Gold",     icon: "🥇", color: "#F59E0B" }
             : inforceCount >= 2  ? { label: "Silver",   icon: "🥈", color: "#94A3B8" }
             : inforceCount >= 1  ? { label: "Bronze",   icon: "🥉", color: "#D34108" }
             :                      { label: "New",       icon: "🌱", color: "#22C55E" };

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2" style={{ background: "linear-gradient(180deg, #F8F9FB 0%, #FFFFFF 100%)" }}>

      {/* ── Row 1: Hero banner + achievement + tier ── */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-3">

        {/* Hero banner */}
        <div className="relative rounded-2xl overflow-hidden min-h-[96px]"
          style={{ background: "linear-gradient(90deg, #1A2535 0%, #1F2D3D 20%, #6B2D0E 55%, #D34108 78%, #FF8C52 92%, #FFF0E8 100%)" }}>
          <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 100%)" }} />
          <div className="relative z-10 flex items-center gap-4 px-5 py-4">
            <div className="shrink-0 flex size-12 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #D34108, #EA6921)" }}>
              <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{greeting} 👋</p>
              <p className="text-lg font-bold text-white leading-snug" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                {inforceCount > 0 ? `${inforceCount} ${inforceCount === 1 ? "life" : "lives"} protected` : "Ready to protect lives"}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {leads.length} clients · {activeCount} active
                {overdueCount > 0 && <span style={{ color: "#FCA5A5" }}> · {overdueCount} overdue</span>}
              </p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <DonutChart pct={completionPct} color="#D34108" size={60} />
            </div>
          </div>
        </div>

        {/* Achievement tier card */}
        <div className="rounded-2xl border border-secondary bg-white px-4 py-3 flex flex-col items-center justify-center gap-1 min-w-[90px]"
          style={{ boxShadow: `0 0 0 2px ${tier.color}22, inset 0 1px 0 rgba(255,255,255,0.8)` }}>
          <span className="text-3xl">{tier.icon}</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>{tier.label}</p>
          <p className="text-[9px] text-quaternary text-center leading-tight">Adviser Tier</p>
        </div>

        {/* Inforce target */}
        <div className="rounded-2xl border border-secondary bg-white px-4 py-3 flex flex-col items-center justify-center gap-1 min-w-[90px]"
          style={{ background: "linear-gradient(135deg, #FFF7ED, #FFF)" }}>
          <p className="text-2xl font-bold tabular-nums" style={{ fontFamily: "'Metrophobic', sans-serif", color: "#D34108" }}>{inforceCount}</p>
          <p className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Inforce</p>
          <div className="w-12 h-1 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full rounded-full bg-[#D34108]" style={{ width: `${Math.min(100, (inforceCount / 10) * 100)}%` }} />
          </div>
          <p className="text-[9px] text-quaternary">{inforceCount}/10 target</p>
        </div>
      </div>

      {/* ── Row 2: Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        {/* Tasks completed */}
        <div className="rounded-xl border border-secondary bg-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold tabular-nums text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{completedTasks}</p>
            <p className="text-[10px] font-medium text-tertiary mt-0.5">Tasks done</p>
            <p className="text-[9px] text-quaternary">{completionPct}% rate</p>
          </div>
          <BarChart values={taskBars} color="#D34108" />
        </div>

        {/* Total clients */}
        <div className="rounded-xl border border-secondary bg-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold tabular-nums text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{leads.length}</p>
            <p className="text-[10px] font-medium text-tertiary mt-0.5">Clients</p>
            <p className="text-[9px] text-quaternary">{activeCount} active now</p>
          </div>
          <BarChart values={clientBars} color="#3B82F6" />
        </div>

        {/* Active apps */}
        <div className="rounded-xl border border-secondary bg-white px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold tabular-nums" style={{ fontFamily: "'Metrophobic', sans-serif", color: "#22C55E" }}>{activeCount}</p>
            <p className="text-[10px] font-medium text-tertiary mt-0.5">In progress</p>
            <p className="text-[9px] text-quaternary">applications</p>
          </div>
          <BarChart values={[1,2,3,2,4,3, Math.max(1, activeCount)]} color="#22C55E" />
        </div>

        {/* Overdue / all clear */}
        <div className={"rounded-xl border px-4 py-3 flex items-center justify-between " +
          (overdueCount > 0 ? "border-[#FECACA] bg-[#FFF5F5]" : "border-success-solid bg-success-secondary")}>
          <div>
            <p className={"text-xl font-bold tabular-nums " + (overdueCount > 0 ? "text-[#B91C1C]" : "text-success-primary")}
              style={{ fontFamily: "'Metrophobic', sans-serif" }}>{overdueCount > 0 ? overdueCount : "✓"}</p>
            <p className="text-[10px] font-medium text-tertiary mt-0.5">{overdueCount > 0 ? "Overdue" : "All clear"}</p>
            <p className="text-[9px] text-quaternary">{overdueCount > 0 ? "need action" : "on track"}</p>
          </div>
          <BarChart values={[1,0,2,1,3,2, Math.max(0, overdueCount)]} color={overdueCount > 0 ? "#EF4444" : "#22C55E"} />
        </div>
      </div>
    </div>
  );
}


// ─── Global tile bar ─────────────────────────────────────────────────────────
// These stat tiles sit below the hero and wire directly into Universal Search.
type GlobalTile = "total" | "overdue" | "amber" | "fresh";

interface GlobalTileBarProps {
  leads: SimLead[];
  allTasks: SimTask[];
  active: GlobalTile | null;
  onToggle: (t: GlobalTile) => void;
}

function GlobalTileBar({ leads, allTasks, active, onToggle }: GlobalTileBarProps) {
  const total       = APPLICATION_CHAIN.length;
  const totalClients  = leads.length;
  const overdueCount  = leads.filter(l => allTasks.some(t => t.leadId === l.id && t.status === "open" && getTaskPriority(t) === "critical")).length;
  const amberCount    = leads.filter(l => {
    const open = allTasks.filter(t => t.leadId === l.id && t.status === "open");
    return open.length > 0 && open.every(t => getTaskPriority(t) !== "critical") && open.some(t => getTaskPriority(t) === "high");
  }).length;
  const freshCount    = leads.filter(l => {
    const done = allTasks.filter(t => t.leadId === l.id && t.status === "completed" && !t.parentTaskId).length;
    if (done >= total) return false;
    const open = allTasks.filter(t => t.leadId === l.id && t.status === "open");
    return open.length > 0 && open.every(t => getTaskPriority(t) === "normal");
  }).length;

  const tiles: { key: GlobalTile | null; label: string; value: number | string; accent: string; bg: string; activeBg: string; activeBorder: string }[] = [
    { key: null,       label: "Total tasks",  value: totalClients, accent: "text-[#1A2535]",       bg: "bg-white",            activeBg: "bg-[#1A2535]",     activeBorder: "border-[#1A2535]" },
    { key: "overdue",  label: "Overdue",      value: overdueCount, accent: "text-[#B91C1C]",       bg: "bg-white",            activeBg: "bg-[#FEF2F2]",     activeBorder: "border-[#EF4444]" },
    { key: "amber",    label: "Amber",        value: amberCount,   accent: "text-[#92400E]",       bg: "bg-white",            activeBg: "bg-[#FFFBEB]",     activeBorder: "border-[#F59E0B]" },
    { key: "fresh",    label: "New",          value: freshCount,   accent: "text-[#065F46]",       bg: "bg-white",            activeBg: "bg-[#F0FDF4]",     activeBorder: "border-[#22C55E]" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-4 pt-2">
      <div className="grid grid-cols-4 gap-3">
        {tiles.map(({ key, label, value, accent, bg, activeBg, activeBorder }) => {
          const isActive = key === null ? active === null : active === key;
          return (
            <button key={label}
              onClick={() => key === null ? onToggle(null as any) : onToggle(key)}
              className={"group rounded-xl border px-4 py-3 text-left transition-all hover:shadow-md " +
                (isActive
                  ? activeBg + " " + activeBorder + " shadow-sm"
                  : bg + " border-secondary hover:border-primary")}>
              <div className="flex items-center justify-between mb-1">
                <p className={"text-2xl font-bold tabular-nums transition-colors " + (isActive ? accent : "text-primary")}
                  style={{ fontFamily: "'Metrophobic', sans-serif" }}>{value}</p>
                {key === "overdue" && <span className="size-2 rounded-full bg-[#EF4444] animate-pulse" />}
                {key === "amber"   && <span className="size-2 rounded-full bg-[#F59E0B]" />}
                {key === "fresh"   && <span className="size-2 rounded-full bg-[#22C55E]" />}
              </div>
              <p className={"text-[10px] font-semibold uppercase tracking-wider transition-colors " + (isActive ? accent : "text-quaternary")}>{label}</p>
              {isActive && (
                <p className="text-[9px] text-quaternary mt-0.5">Click to clear filter</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Resizable widget row ─────────────────────────────────────────────────────
// Drag the divider handle left/right to resize adjacent widgets.

function ResizableWorkbench({
  widgets, onRemove, onSelectTask, onSelectClient, tabId, globalTileFilter, onAddWidget
}: {
  widgets: string[];
  onRemove: (id: string) => void;
  onSelectTask: (t: SimTask) => void;
  onSelectClient: (id: string) => void;
  tabId: string;
  globalTileFilter: GlobalTile | null;
  onAddWidget: () => void;
}) {
  const STORAGE_KEY = "axis_widget_widths_v1";
  function loadWidths(): Record<string, number[]> {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
  }
  function saveWidths(w: Record<string, number[]>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  }

  const [allWidths, setAllWidths] = useState<Record<string, number[]>>(loadWidths);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ idx: number; startX: number; startWidths: number[] } | null>(null);

  // Get or initialise widths for current tab+widgets
  function getWidths(): number[] {
    const stored = allWidths[tabId];
    if (stored && stored.length === widgets.length) return stored;
    return widgets.map(() => 100 / widgets.length);
  }

  const widths = getWidths();

  function setWidths(next: number[]) {
    setAllWidths(prev => {
      const updated = { ...prev, [tabId]: next };
      saveWidths(updated);
      return updated;
    });
  }

  // Reset widths when widget count changes
  useEffect(() => {
    const stored = allWidths[tabId];
    if (!stored || stored.length !== widgets.length) {
      setWidths(widgets.map(() => 100 / widgets.length));
    }
  }, [widgets.length, tabId]);

  function onDragStart(e: React.MouseEvent, idx: number) {
    e.preventDefault();
    dragRef.current = { idx, startX: e.clientX, startWidths: [...widths] };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const containerW = containerRef.current.getBoundingClientRect().width;
      const deltaX = ev.clientX - dragRef.current.startX;
      const deltaPct = (deltaX / containerW) * 100;
      const next = [...dragRef.current.startWidths];
      const i = dragRef.current.idx;
      next[i]     = Math.max(20, Math.min(80, dragRef.current.startWidths[i]     + deltaPct));
      next[i + 1] = Math.max(20, Math.min(80, dragRef.current.startWidths[i + 1] - deltaPct));
      // Clamp so they sum to original pair total
      const pairTotal = dragRef.current.startWidths[i] + dragRef.current.startWidths[i + 1];
      next[i + 1] = pairTotal - next[i];
      if (next[i + 1] < 20) { next[i] = pairTotal - 20; next[i + 1] = 20; }
      setWidths(next);
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id) ?? { label: id, description: "" };

  if (widgets.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-secondary bg-primary shadow-xs">
          <Plus className="size-7 text-fg-quaternary" />
        </div>
        <div>
          <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Tab is empty</p>
          <p className="text-sm text-tertiary mt-1.5 max-w-sm">Add widgets to surface the data that matters most.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex gap-0 w-full select-none" style={{ minHeight: 520 }}>
      {widgets.map((id, i) => (
        <React.Fragment key={id}>
          {/* Widget */}
          <div className="flex flex-col" style={{ width: `${widths[i] ?? 50}%`, minWidth: 0 }}>
            <div className="flex flex-col rounded-2xl border border-secondary bg-white h-full"
              style={{ margin: "0 6px", minHeight: 480, boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)" }}>
              {/* Widget header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-secondary shrink-0">
                <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                  {getWidget(id).label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-quaternary hidden sm:block">{Math.round(widths[i] ?? 50)}%</span>
                  <button onClick={() => onRemove(id)}
                    className="text-xs text-quaternary hover:text-secondary transition-colors px-2 py-1 rounded hover:bg-secondary">Remove</button>
                </div>
              </div>
              {/* Widget content */}
              <div className="flex flex-col flex-1 min-h-0 p-5 overflow-hidden">
                <WidgetContent id={id} onSelectTask={onSelectTask} onSelectClient={onSelectClient} globalTileFilter={globalTileFilter} />
              </div>
            </div>
          </div>

          {/* Drag handle between adjacent widgets */}
          {i < widgets.length - 1 && (
            <div
              className="group relative flex items-center justify-center shrink-0 cursor-col-resize z-10"
              style={{ width: 12 }}
              onMouseDown={e => onDragStart(e, i)}>
              <div className="w-0.5 h-12 rounded-full bg-secondary group-hover:bg-brand-solid group-hover:h-20 transition-all duration-150" />
              <div className="absolute inset-y-0 -left-1 -right-1" /> {/* wider hit target */}
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Empty slot */}
      <div className="flex flex-col" style={{ width: 180, minWidth: 180 }}>
        <button onClick={onAddWidget}
          className="group mx-1.5 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-secondary bg-transparent p-6 text-center transition hover:border-brand hover:bg-brand-secondary cursor-pointer h-full"
          style={{ minHeight: 100 }}>
          <Plus className="size-5 text-fg-quaternary group-hover:text-brand-secondary" />
          <p className="text-xs font-medium text-quaternary group-hover:text-brand-secondary">Add widget</p>
        </button>
      </div>
    </div>
  );
}

// ─── Workbench tab type ───────────────────────────────────────────────────────
interface WorkbenchTab { id: string; label: string; widgets: string[]; }

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const location = useLocation();
  const isSettings = location.pathname === "/settings" || location.pathname.startsWith("/settings/");

  const { toast } = useToast();

  // Init sim store on mount
  useEffect(() => { initSimStore(); }, []);

  const [tabs, setTabs] = useState<WorkbenchTab[]>([{ id: "default", label: "Default", widgets: ["priorities", "universal_search"] }]);
  const [activeTabId, setActiveTabId] = useState("default");
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; tabId: string; current: string }>({ open: false, tabId: "", current: "" });
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<SimTask | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [heroTasks, setHeroTasks] = useState<SimTask[]>([]);
  const [globalTileFilter, setGlobalTileFilter] = useState<GlobalTile | null>(null);

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setHeroTasks(getTasks()); };
    refresh();
    window.addEventListener("axis_sim_update", refresh);
    return () => window.removeEventListener("axis_sim_update", refresh);
  }, []);

  function dispatchUpdate() { window.dispatchEvent(new Event("axis_sim_update")); }

  const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];
  const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id) ?? { label: id, description: "" };
  const activeLead = activeTask ? leads.find(l => l.id === activeTask.leadId) : undefined;

  function addTab() {
    const id = Date.now().toString();
    setTabs(prev => [...prev, { id, label: "Tab " + (prev.length + 1), widgets: [] }]);
    setActiveTabId(id);
  }

  function removeTab(id: string) {
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    setTabs(prev => prev.filter(t => t.id !== id));
    if (activeTabId === id) setActiveTabId(tabs[idx > 0 ? idx - 1 : 1]?.id ?? tabs[0].id);
  }

  function renameTab(id: string, label: string) { setTabs(prev => prev.map(t => t.id === id ? { ...t, label } : t)); }
  function addWidget(wid: string) { setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, widgets: [...t.widgets, wid] } : t)); }
  function removeWidget(wid: string) { setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, widgets: t.widgets.filter(w => w !== wid) } : t)); }

  function handleSimulated() { dispatchUpdate(); }
  function handleTaskAction() { setActiveTask(null); dispatchUpdate(); }

  function handleReset() {
    if (confirm("Reset all simulation data? This will remove all clients and tasks.")) {
      resetSim();
      initSimStore();
      dispatchUpdate();
      toast({ title: "Simulation reset", description: "Seed data reloaded, ready for a fresh demo.", variant: "info", duration: 4000 });
    }
  }

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
      <main className="min-h-screen overflow-x-hidden lg:flex-1">
        {isSettings ? (
          <Settings />
        ) : (
          <div className="flex flex-col h-full">
            {/* Workbench Hero */}
            <WorkbenchHero leads={leads} allTasks={heroTasks} />

            {/* Global stat tiles */}
            <GlobalTileBar leads={leads} allTasks={heroTasks} active={globalTileFilter} onToggle={t => setGlobalTileFilter(prev => prev === t ? null : t)} />

            {/* Tab bar + action buttons */}
            <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center overflow-x-auto gap-0 -mb-px">
                  {tabs.map(tab => {
                    const isActive = tab.id === activeTabId;
                    return (
                      <div key={tab.id} className="group relative flex items-center">
                        <button onClick={() => setActiveTabId(tab.id)}
                          onDoubleClick={() => setRenameModal({ open: true, tabId: tab.id, current: tab.label })}
                          className={"flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                          {tab.label}
                        </button>
                        <div className="absolute right-0 top-1 hidden group-hover:flex items-center gap-0.5 pr-1">
                          <button onClick={() => setRenameModal({ open: true, tabId: tab.id, current: tab.label })}
                            className="flex size-5 items-center justify-center rounded text-fg-quaternary hover:bg-secondary hover:text-secondary transition-colors">
                            <Settings01 className="size-3" />
                          </button>
                          {tabs.length > 1 && (
                            <button onClick={() => removeTab(tab.id)}
                              className="flex size-5 items-center justify-center rounded text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors">
                              <X className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={addTab} className="flex size-9 items-center justify-center text-fg-quaternary hover:text-secondary hover:bg-secondary_alt rounded transition-colors ml-1 mb-px">
                    <Plus className="size-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 py-2 shrink-0">
                  <button onClick={handleReset} title="Reset"
                    className="flex size-8 items-center justify-center rounded-lg border border-secondary bg-primary text-fg-quaternary hover:bg-secondary transition-colors">
                    <RefreshCcw01 className="size-3.5" />
                  </button>
                  <button onClick={() => setSimModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-secondary px-3 py-1.5 text-xs font-medium text-brand-secondary hover:bg-brand-primary_alt transition-colors whitespace-nowrap">
                    <Zap className="size-3" /><span className="hidden sm:inline">Simulate </span>client
                  </button>
                  <button onClick={() => setWidgetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-solid_hover transition-colors whitespace-nowrap">
                    <Plus className="size-3" /><span className="hidden sm:inline">Add </span>widget
                  </button>
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="px-4 sm:px-6 lg:px-8 pb-8 pt-4 overflow-x-auto">
              <ResizableWorkbench
                widgets={activeTab.widgets}
                onRemove={removeWidget}
                onSelectTask={setActiveTask}
                onSelectClient={setSelectedClientId}
                tabId={activeTabId}
                globalTileFilter={globalTileFilter}
                onAddWidget={() => setWidgetModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Client slideout */}
      <ClientSlideout
        lead={leads.find(l => l.id === selectedClientId) ?? null}
        tasks={getTasks().filter(t => t.leadId === selectedClientId)}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onSelectTask={(task) => { setSelectedClientId(null); setTimeout(() => setActiveTask(task), 50); }}
      />
      <AddWidgetModal open={widgetModalOpen} onClose={() => setWidgetModalOpen(false)} onAdd={addWidget} existingWidgets={activeTab.widgets} />
      <RenameTabModal open={renameModal.open} current={renameModal.current} onSave={label => renameTab(renameModal.tabId, label)} onClose={() => setRenameModal({ open: false, tabId: "", current: "" })} />
      <SimulateLeadModal open={simModalOpen} onClose={() => setSimModalOpen(false)} onSimulated={handleSimulated} onToast={toast} onOpenTask={(task) => { setTimeout(() => setActiveTask(task), 50); }} />
      {activeTask && <TaskActionModal task={activeTask} lead={activeLead} onClose={() => setActiveTask(null)} onAction={handleTaskAction} onToast={toast} onOpenTask={(t) => { setActiveTask(null); setTimeout(() => setActiveTask(t), 50); }} onViewProfile={(id) => { setActiveTask(null); setTimeout(() => setSelectedClientId(id), 50); }} />}
    </div>
  );
}

