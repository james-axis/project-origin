import { Plus, X, Check, Settings01, Users01, List, RefreshCcw01, ChevronRight, Zap } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
import { Settings } from "@/pages/settings";
import { useToast } from "@/components/toast";
import { TaskPanel, type TaskPanelData } from "@/components/task-panels";
import { getPanelData, savePanelData } from "@/store/sim-store";
import {
  initSimStore, getLeads, addLead, getTasks, getOpenTasks,
  fireFirstTask, completeTask, attemptTask, resetSim,
  APPLICATION_CHAIN,
  type SimLead, type SimTask,
} from "@/store/sim-store";

// ─── Seed names for "Simulate lead" button ────────────────────────────────────
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
function TaskActionModal({ task, lead, onClose, onAction, onToast, onOpenTask }: {
  task: SimTask;
  lead: SimLead | undefined;
  onClose: () => void;
  onAction: () => void;
  onToast: (opts: import("@/components/toast").ToastOptions) => void;
  onOpenTask: (t: SimTask) => void;
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
      onToast({ title: "🎉 Lead is inforce!", description: `${lead?.firstName} ${lead?.lastName} — all tasks complete`, variant: "success", duration: 7000 });
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
                {lead && <> · <span className="text-secondary">{lead.firstName} {lead.lastName}</span></>}
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

// ─── Simulate lead modal ──────────────────────────────────────────────────────
function SimulateLeadModal({ open, onClose, onSimulated, onToast }: { open: boolean; onClose: () => void; onSimulated: (lead: SimLead) => void; onToast: (opts: import("@/components/toast").ToastOptions) => void }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;
  const preview = NEW_LEAD_POOL[idx % NEW_LEAD_POOL.length];

  function fire() {
    const lead = addLead(preview);
    fireFirstTask(lead);
    setIdx(i => i + 1);
    onSimulated(lead);
    onClose();
    onToast({
      title: "New lead arrived",
      description: `${lead.firstName} ${lead.lastName} — Introduction Call assigned to Consultant`,
      variant: "info",
      duration: 6000,
      actions: [
        { label: "View task", onClick: () => {} },
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
            <h3 className="text-base font-semibold text-primary">Simulate new lead</h3>
            <p className="text-sm text-tertiary mt-0.5">Fires Task 1 of the Application chain</p>
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
            <p className="text-xs text-brand-secondary">Will fire: <strong>Introduction Call</strong> → assigned to Consultant</p>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
          <button onClick={fire} className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
            <span className="flex items-center justify-center gap-1.5"><Zap className="size-3.5" />Fire lead</span>
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

// ─── Tasks widget ─────────────────────────────────────────────────────────────
function TasksWidget({ onSelectTask }: { onSelectTask: (task: SimTask) => void }) {
  const [tasks, setTasks] = useState<SimTask[]>([]);
  const [leads, setLeads] = useState<SimLead[]>([]);

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

  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-secondary_alt py-8 text-center gap-2">
        <List className="size-6 text-fg-quaternary" />
        <p className="text-xs text-tertiary">No open tasks — simulate a lead to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-80">
      {tasks.map(task => {
        const lead = getLead(task.leadId);
        const isSubtask = !!task.parentTaskId;
        return (
          <button key={task.id} onClick={() => onSelectTask(task)}
            className="flex items-center gap-3 rounded-xl border border-secondary bg-primary px-3 py-3 text-left hover:border-brand hover:bg-brand-secondary transition-colors group">
            <div className={"flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold " + (ROLE_COLORS[task.assigneeRole] ?? "bg-secondary text-secondary")}>
              {isSubtask ? "↳" : APPLICATION_CHAIN.findIndex(t => t.id === task.templateTaskId) + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary truncate">{task.name}</p>
              <p className="text-xs text-tertiary truncate">
                {lead ? `${lead.firstName} ${lead.lastName}` : "Unknown"} · {task.assigneeRole}
                {isSubtask && <span className="text-warning-primary"> · subtask</span>}
              </p>
            </div>
            <ChevronRight className="size-4 text-fg-quaternary group-hover:text-brand-secondary shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Leads widget ─────────────────────────────────────────────────────────────
function LeadsWidget() {
  const [leads, setLeads] = useState<SimLead[]>([]);
  const [allTasks, setAllTasks] = useState<SimTask[]>([]);

  useEffect(() => {
    const refresh = () => { setLeads(getLeads()); setAllTasks(getTasks()); };
    refresh();
    window.addEventListener("axis_sim_update", refresh);
    return () => window.removeEventListener("axis_sim_update", refresh);
  }, []);

  if (leads.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg bg-secondary_alt py-8 text-center gap-2">
        <Users01 className="size-6 text-fg-quaternary" />
        <p className="text-xs text-tertiary">No clients yet — simulate a lead to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-80">
      {leads.slice().reverse().map(lead => {
        const leadTasks = allTasks.filter(t => t.leadId === lead.id);
        const openCount = leadTasks.filter(t => t.status === "open").length;
        const completedCount = leadTasks.filter(t => t.status === "completed" && !t.parentTaskId).length;
        const total = APPLICATION_CHAIN.length;
        const pct = Math.round((completedCount / total) * 100);
        return (
          <div key={lead.id} className="flex items-center gap-3 rounded-xl border border-secondary bg-primary px-3 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-xs font-semibold text-brand-secondary">
              {lead.firstName[0]}{lead.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{lead.firstName} {lead.lastName}</p>
              <p className="text-xs text-tertiary">{lead.policyType} · {lead.practice}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 rounded-full bg-tertiary overflow-hidden">
                  <div className="h-full rounded-full bg-brand-solid transition-all" style={{ width: pct + "%" }} />
                </div>
                <span className="text-[10px] text-quaternary shrink-0">{completedCount}/{total}</span>
              </div>
            </div>
            {openCount > 0 && (
              <span className="shrink-0 rounded-full bg-brand-solid px-2 py-0.5 text-[10px] font-semibold text-white">{openCount}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Generic placeholder widget ───────────────────────────────────────────────
const PlaceholderWidget = ({ description }: { description: string }) => (
  <div className="flex flex-1 items-center justify-center rounded-lg bg-secondary_alt">
    <p className="text-xs text-quaternary">{description}</p>
  </div>
);

function WidgetContent({ id, onSelectTask }: { id: string; onSelectTask: (t: SimTask) => void }) {
  const w = AVAILABLE_WIDGETS.find(w => w.id === id);
  if (id === "tasks") return <TasksWidget onSelectTask={onSelectTask} />;
  if (id === "leads") return <LeadsWidget />;
  return <PlaceholderWidget description={w?.description ?? ""} />;
}

// ─── Widget card ──────────────────────────────────────────────────────────────
const WidgetCard = ({ id, label, onRemove, onSelectTask }: { id: string; label: string; onRemove: () => void; onSelectTask: (t: SimTask) => void }) => (
  <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5 shadow-xs min-h-64">
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{label}</p>
      <button onClick={onRemove} className="text-xs text-quaternary hover:text-secondary transition">Remove</button>
    </div>
    <WidgetContent id={id} onSelectTask={onSelectTask} />
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

  const [tabs, setTabs] = useState<WorkbenchTab[]>([{ id: "default", label: "Default", widgets: ["tasks", "leads"] }]);
  const [activeTabId, setActiveTabId] = useState("default");
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [renameModal, setRenameModal] = useState<{ open: boolean; tabId: string; current: string }>({ open: false, tabId: "", current: "" });
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<SimTask | null>(null);
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
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} title="Reset simulation data"
                    className="flex size-8 items-center justify-center rounded-lg border border-secondary bg-primary text-fg-quaternary hover:bg-secondary hover:text-secondary transition-colors">
                    <RefreshCcw01 className="size-3.5" aria-hidden />
                  </button>
                  <button onClick={() => setSimModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand bg-brand-secondary px-3 py-2 text-sm font-medium text-brand-secondary hover:bg-brand-primary_alt transition-colors">
                    <Zap className="size-3.5" aria-hidden />Simulate lead
                  </button>
                  <button onClick={() => setWidgetModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                    <Plus className="size-3.5" aria-hidden />Add widget
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeTab.widgets.map(id => (
                    <WidgetCard key={id} id={id} label={getWidget(id).label} onRemove={() => removeWidget(id)} onSelectTask={setActiveTask} />
                  ))}
                  <EmptySlot onAdd={() => setWidgetModalOpen(true)} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <AddWidgetModal open={widgetModalOpen} onClose={() => setWidgetModalOpen(false)} onAdd={addWidget} existingWidgets={activeTab.widgets} />
      <RenameTabModal open={renameModal.open} current={renameModal.current} onSave={label => renameTab(renameModal.tabId, label)} onClose={() => setRenameModal({ open: false, tabId: "", current: "" })} />
      <SimulateLeadModal open={simModalOpen} onClose={() => setSimModalOpen(false)} onSimulated={handleSimulated} onToast={toast} />
      {activeTask && <TaskActionModal task={activeTask} lead={activeLead} onClose={() => setActiveTask(null)} onAction={handleTaskAction} onToast={toast} onOpenTask={(t) => { setActiveTask(null); setTimeout(() => setActiveTask(t), 50); }} />}
    </div>
  );
}
