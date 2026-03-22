import { Plus, X, Check, Settings01, Users01, List, RefreshCcw01, ChevronRight, Zap } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { useState, useEffect, useCallback } from "react";
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

  // Stats
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

  const STATUS_BADGE: Record<string, string> = {
    new:      "bg-success-secondary text-success-primary",
    overdue:  "bg-[#FEE2E2] text-[#B91C1C]",
    active:   "bg-brand-secondary text-brand-secondary",
    complete: "bg-success-secondary text-success-primary",
  };
  const STATUS_DOT: Record<string, string> = {
    new: "bg-success-solid", overdue: "bg-[#EF4444]", active: "bg-brand-solid", complete: "bg-success-solid",
  };
  const STATUS_LABEL: Record<string, string> = {
    new: "New", overdue: "Overdue", active: "Active", complete: "Complete",
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {([
          { label: "New",      value: newCount,      filterKey: "new"      as const, beacon: "green" as BeaconColor },
          { label: "Overdue",  value: overdueCount,  filterKey: "overdue"  as const, beacon: "red"   as BeaconColor },
          { label: "Active",   value: activeCount,   filterKey: "active"   as const, beacon: "amber" as BeaconColor },
          { label: "Complete", value: completeCount, filterKey: "complete" as const, beacon: undefined },
        ]).map(({ label, value, filterKey, beacon }) => {
          const isActive = statusFilter === filterKey;
          return (
            <button key={label} onClick={() => setStatusFilter(isActive ? "all" : filterKey)}
              className={"rounded-xl border px-3 py-3 text-left transition-all " +
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
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="size-3.5 text-fg-quaternary" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applications..."
            className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-lg border border-secondary bg-primary pl-3 pr-7 py-1.5 text-xs text-primary outline-none focus:border-brand appearance-none cursor-pointer">
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="overdue">Overdue</option>
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

      {/* ── URGENT section ── */}
      {urgentApp && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-quaternary uppercase tracking-wider">Urgent</span>
              <span className="rounded-full bg-[#FEE2E2] text-[#B91C1C] text-[10px] font-semibold px-1.5 py-0.5">{urgentApps.length}</span>
            </div>
            {urgentApps.length > 1 && (
              <button onClick={() => setShowAllUrgent(v => !v)}
                className="text-[10px] text-brand-secondary hover:underline font-medium">
                {showAllUrgent ? "Show less" : `View all ${urgentApps.length}`}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {(showAllUrgent ? urgentApps : [urgentApp]).map((lead, i, arr) => {
              const lt = allTasks.filter(t => t.leadId === lead.id);
              const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
              const pct = Math.round((done / total) * 100);
              const appStatus = getAppStatus(lead.id);
              const isNew = isNewApp(lead);
              const ct = getCurrentTask(lead.id);
              return (
                <div key={lead.id}>
                  <button onClick={() => { ct ? onSelectTask(ct) : onSelectClient(lead.id); }}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-primary truncate">{lead.firstName} {lead.lastName}</p>
                          <span className={"rounded-full text-[10px] font-semibold px-1.5 py-0.5 " + STATUS_BADGE[appStatus]}>{STATUS_LABEL[appStatus]}</span>
                          {isNew && appStatus !== "overdue" && <Countdown createdAt={lead.createdAt} />}
                        </div>
                        <p className="text-[10px] text-tertiary truncate">{lead.policyType} · {ct ? ct.name : "No open task"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={"h-full rounded-full " + (appStatus === "overdue" ? "bg-[#EF4444]" : "bg-success-solid")} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-quaternary shrink-0">{done}/{total}</span>
                    </div>
                  </button>
                  {i < arr.length - 1 && <div className="h-px bg-secondary mt-1.5" />}
                </div>
              );
            })}
        </div>
      </div>
      )}

      {/* ── Divider ── */}
      {urgentApp && filtered.length > 0 && (
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-secondary" />
          <span className="text-[10px] text-quaternary uppercase tracking-wider shrink-0">All applications</span>
          <div className="flex-1 h-px bg-secondary" />
        </div>
      )}

      {/* ── Application tiles ── */}
      <div className="overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 300 }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-xl border border-dashed border-secondary">
            <List className="size-5 text-fg-quaternary" />
            <p className="text-xs text-tertiary">No applications match</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filtered.map(lead => {
              const lt = allTasks.filter(t => t.leadId === lead.id);
              const done = lt.filter(t => t.status === "completed" && !t.parentTaskId).length;
              const pct = Math.round((done / total) * 100);
              const appStatus = getAppStatus(lead.id);
              const ct = getCurrentTask(lead.id);
              return (
                <button key={lead.id}
                  onClick={() => { ct ? onSelectTask(ct) : onSelectClient(lead.id); }}
                  className="group flex flex-col gap-2 rounded-xl border border-secondary bg-primary p-3 text-left transition-all hover:border-brand hover:shadow-sm">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-bold text-brand-secondary">
                      {lead.firstName[0]}{lead.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary truncate group-hover:text-brand-secondary transition-colors">{lead.firstName} {lead.lastName}</p>
                      <p className="text-[10px] text-tertiary truncate">{lead.policyType} · {lead.practice}</p>
                    </div>
                    <span className={"inline-flex items-center gap-1 rounded-md border border-secondary px-1.5 py-0.5 text-[10px] font-medium " + STATUS_BADGE[appStatus]}>
                      <span className={"size-1.5 rounded-full inline-block shrink-0 " + STATUS_DOT[appStatus]} />
                      {STATUS_LABEL[appStatus]}
                    </span>
                  </div>
                  {/* Current task */}
                  {ct && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-secondary_alt px-2.5 py-1.5">
                      <Beacon color={getTaskPriority(ct) === "critical" ? "red" : getTaskPriority(ct) === "high" ? "amber" : "green"} />
                      <p className="text-[10px] text-secondary truncate flex-1">
                        Step {APPLICATION_CHAIN.findIndex(c => c.id === ct.templateTaskId) + 1}: {ct.name}
                      </p>
                      <span className="text-[10px] text-quaternary shrink-0">{ct.assigneeRole}</span>
                    </div>
                  )}
                  {/* Progress */}
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={"h-full rounded-full transition-all " + (appStatus === "complete" ? "bg-success-solid" : appStatus === "overdue" ? "bg-[#EF4444]" : "bg-brand-solid")} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-quaternary">{done}/{total} tasks complete · {pct}%</p>
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

// ─── Generic placeholder widget ───────────────────────────────────────────────
const PlaceholderWidget = ({ description }: { description: string }) => (
  <div className="flex flex-1 items-center justify-center rounded-lg bg-secondary_alt">
    <p className="text-xs text-quaternary">{description}</p>
  </div>
);

function WidgetContent({ id, onSelectTask, onSelectClient }: { id: string; onSelectTask: (t: SimTask) => void; onSelectClient: (id: string) => void }) {
  const w = AVAILABLE_WIDGETS.find(w => w.id === id);
  if (id === "tasks")        return <TasksWidget onSelectTask={onSelectTask} />;
  if (id === "leads")        return <LeadsWidget onSelectClient={onSelectClient} />;
  if (id === "applications") return <ApplicationsWidget onSelectTask={onSelectTask} onSelectClient={onSelectClient} />;
  return <PlaceholderWidget description={w?.description ?? ""} />;
}

// ─── Widget card ──────────────────────────────────────────────────────────────
const WidgetCard = ({ id, label, onRemove, onSelectTask, onSelectClient }: { id: string; label: string; onRemove: () => void; onSelectTask: (t: SimTask) => void; onSelectClient: (id: string) => void }) => (
  <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5 shadow-xs" style={{ minHeight: 480 }}>
    <div className="flex items-center justify-between mb-4">
      <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{label}</p>
      <button onClick={onRemove} className="text-xs text-quaternary hover:text-secondary transition">Remove</button>
    </div>
    <WidgetContent id={id} onSelectTask={onSelectTask} onSelectClient={onSelectClient} />
  </div>
);

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

// ─── Workbench tab type ───────────────────────────────────────────────────────
interface WorkbenchTab { id: string; label: string; widgets: string[]; }

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export function HomeScreen() {
  const location = useLocation();
  const isSettings = location.pathname === "/settings" || location.pathname.startsWith("/settings/");

  const { toast } = useToast();

  // Init sim store on mount
  useEffect(() => { initSimStore(); }, []);

  const [tabs, setTabs] = useState<WorkbenchTab[]>([{ id: "default", label: "Default", widgets: ["tasks", "leads", "applications"] }]);
  const [activeTabId, setActiveTabId] = useState("default");
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; tabId: string; current: string }>({ open: false, tabId: "", current: "" });
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<SimTask | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [leads, setLeads] = useState<SimLead[]>([]);

  useEffect(() => {
    const refresh = () => setLeads(getLeads());
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
    <div className="lg:flex min-h-screen bg-primary">
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
      <main className="min-h-screen bg-primary overflow-x-hidden lg:flex-1">
        {isSettings ? (
          <Settings />
        ) : (
          <div className="flex flex-col h-full">
            {/* Header — matches Settings exactly */}
            <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Workbench</h1>
                  <p className="text-sm text-tertiary mt-0.5">Your personalised CRM dashboard</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <button onClick={handleReset} title="Reset"
                    className="flex size-8 items-center justify-center rounded-lg border border-secondary bg-primary text-fg-quaternary hover:bg-secondary hover:text-secondary transition-colors shrink-0">
                    <RefreshCcw01 className="size-3.5" aria-hidden />
                  </button>
                  <button onClick={() => setSimModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-secondary px-3 py-2 text-sm font-medium text-brand-secondary hover:bg-brand-primary_alt transition-colors whitespace-nowrap">
                    <Zap className="size-3.5" aria-hidden /><span className="hidden sm:inline">Simulate </span>client
                  </button>
                  <button onClick={() => setWidgetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors whitespace-nowrap">
                    <Plus className="size-3.5" aria-hidden /><span className="hidden sm:inline">Add </span>widget
                  </button>
                </div>
              </div>

              {/* Tab bar */}
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
            </div>

            {/* Tab content */}
            <div className="p-4 pt-6 lg:p-8 lg:pt-6">
              {activeTab.widgets.length === 0 ? (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-secondary bg-primary shadow-xs">
                    <Plus className="size-7 text-fg-quaternary" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{activeTab.label} is empty</p>
                    <p className="text-sm text-tertiary mt-1.5 max-w-sm">Add widgets to surface the data that matters most.</p>
                  </div>
                  <button onClick={() => setWidgetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                    <Plus className="size-4" /> Add your first widget
                  </button>
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))", gridAutoRows: "1fr" }}>
                  {activeTab.widgets.map(id => (
                    <WidgetCard key={id} id={id} label={getWidget(id).label} onRemove={() => removeWidget(id)} onSelectTask={setActiveTask} onSelectClient={setSelectedClientId} />
                  ))}
                  <EmptySlot onAdd={() => setWidgetModalOpen(true)} />
                </div>
              )}
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

