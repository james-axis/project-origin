import React, { useState, useRef, useEffect } from "react";
import {
  Settings01, List, Users01, Shield01, Bell01, Link01,
  ChevronDown, Plus, DotsGrid, Trash01, Edit01, Lock01,
  Zap, Toggle01Right, X, Check, InfoCircle,
} from "@untitledui/icons";

type TriggerType = "object_created" | "task_completed";
type TemplateStatus = "active" | "draft" | "archived";

const PRACTICES = ["All Practices", "LIP", "Tony Insurance", "Surehaven", "Averse to Risk", "Living Rich"];

const PRACTICE_COLORS: Record<string, string> = {
  "All Practices": "bg-secondary text-secondary",
  "LIP": "bg-brand-secondary text-brand-secondary",
  "Tony Insurance": "bg-success-secondary text-success-primary",
  "Surehaven": "bg-purple-100 text-purple-700",
  "Averse to Risk": "bg-warning-secondary text-warning-primary",
  "Living Rich": "bg-error-secondary text-error-primary",
};

interface TaskItem {
  id: number;
  name: string;
  triggerType: TriggerType;
  assigneeRole: string;
  enabled: boolean;
  locked?: boolean;
  condition?: string;
  completionOptions?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  status: TemplateStatus;
  practices: string[];
  tasks: TaskItem[];
}

interface DomainConfig {
  id: string;
  label: string;
  description: string;
  color: string;
  templates: WorkflowTemplate[];
}

const ASSIGNEE_ROLES = ["Consultant", "Admin", "Services", "Compliance", "Manager"];

const settingsTabs = [
  { id: "task-builder", label: "Task Builder", icon: List },
  { id: "general", label: "General", icon: Settings01 },
  { id: "users", label: "Users & Permissions", icon: Users01 },
  { id: "security", label: "Security", icon: Shield01 },
  { id: "notifications", label: "Notifications", icon: Bell01 },
  { id: "integrations", label: "Integrations", icon: Link01 },
];

function makeTasks(defs: Omit<TaskItem, never>[]): TaskItem[] { return defs; }

const initialDomains: DomainConfig[] = [
  {
    id: "application", label: "Application", description: "Full client journey from new lead through to inforce", color: "bg-brand-solid",
    templates: [{
      id: "app-standard", name: "Standard", status: "active", practices: ["All Practices"],
      tasks: makeTasks([
        { id: 166, name: "Introduction Call", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
        { id: 207, name: "Initial Life Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 147, name: "Life Insurance Discussion", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 102, name: "Quote Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 150, name: "Life Insurance Follow-up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 172, name: "Book Insurance Review", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 134, name: "Add Policy / Application Number", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 117, name: "Send application submitted email to client", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 159, name: "Upload face to face documents", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true, condition: "meeting_type = face_to_face" },
        { id: 99, name: "Compliance Audit", triggerType: "task_completed", assigneeRole: "Services", enabled: true, locked: true, completionOptions: ["Pass", "On Hold", "Remediation Required"] },
        { id: 135, name: "Compliance Billing", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 154, name: "Audit Finalisation", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 133, name: "Input life insurance amounts & premiums", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 180, name: "Inforce call & email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
      ]),
    }],
  },
  {
    id: "dishonour", label: "Dishonour", description: "Missed payment recovery flow", color: "bg-warning-solid",
    templates: [{
      id: "dis-standard", name: "Standard", status: "active", practices: ["All Practices"],
      tasks: makeTasks([
        { id: 36, name: "Initial follow up", triggerType: "object_created", assigneeRole: "Consultant", enabled: true },
        { id: 183, name: "Check if policy is paid up to date", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 230, name: "Support action - call / email", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 59, name: "Re-attempt follow up", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true },
        { id: 44, name: "Re-instatement form", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
      ]),
    }],
  },
  {
    id: "claim", label: "Claim", description: "End-to-end claim lodgement and assessment", color: "bg-error-solid",
    templates: [{
      id: "claim-standard", name: "Standard", status: "active", practices: ["All Practices"],
      tasks: makeTasks([
        { id: 47, name: "Initial claims form", triggerType: "object_created", assigneeRole: "Services", enabled: true },
        { id: 64, name: "Certified ID", triggerType: "task_completed", assigneeRole: "Admin", enabled: true },
        { id: 48, name: "Medicare release form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 53, name: "Initial doctors form", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 49, name: "Financials", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 52, name: "TFN declaration", triggerType: "task_completed", assigneeRole: "Services", enabled: true, condition: "claim_type = income_protection" },
        { id: 51, name: "Payment forms", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
        { id: 50, name: "Follow-up assessment", triggerType: "task_completed", assigneeRole: "Services", enabled: true },
      ]),
    }],
  },
];

// ─── Edit Task Modal ──────────────────────────────────────────────────────────
function EditModal({ task, onSave, onClose }: { task: TaskItem | null; onSave: (t: TaskItem) => void; onClose: () => void }) {
  const [form, setForm] = useState<TaskItem>(task ?? { id: Date.now(), name: "", triggerType: "task_completed", assigneeRole: "Consultant", enabled: true });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg rounded-2xl border border-secondary bg-primary shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div><h3 className="text-base font-medium text-primary">{task ? "Edit task" : "New task"}</h3><p className="text-sm text-tertiary">Configure this task in the chain</p></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Task name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Introduction Call" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Assignee role</label>
            <select value={form.assigneeRole} onChange={e => setForm({ ...form, assigneeRole: e.target.value })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand">
              {ASSIGNEE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Condition <span className="font-normal text-tertiary">(optional)</span></label>
            <input value={form.condition ?? ""} onChange={e => setForm({ ...form, condition: e.target.value || undefined })} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. meeting_type = face_to_face" />
            <p className="text-xs text-tertiary">Only create this task when condition is met</p>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-secondary bg-secondary_alt px-4 py-3">
            <div className="flex items-center gap-2.5"><Lock01 className="size-4 text-fg-tertiary shrink-0" aria-hidden /><div><p className="text-sm font-medium text-primary">System locked</p><p className="text-xs text-tertiary">Prevent reordering or deleting</p></div></div>
            <button onClick={() => setForm({ ...form, locked: !form.locked })} className={"relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 " + (form.locked ? "bg-brand-solid" : "bg-tertiary")}>
              <span className={"inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform " + (form.locked ? "translate-x-4" : "translate-x-0.5")} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary">Cancel</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50">
            <Check className="size-3.5" aria-hidden />Save task
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Template Modal ───────────────────────────────────────────────────────
function NewTemplateModal({ domainLabel, onSave, onClose }: { domainLabel: string; onSave: (t: WorkflowTemplate) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [practices, setPractices] = useState<string[]>(["All Practices"]);
  const [status, setStatus] = useState<TemplateStatus>("draft");

  function togglePractice(p: string) {
    if (p === "All Practices") { setPractices(["All Practices"]); return; }
    const without = practices.filter(x => x !== "All Practices");
    if (without.includes(p)) {
      const next = without.filter(x => x !== p);
      setPractices(next.length === 0 ? ["All Practices"] : next);
    } else {
      setPractices([...without, p]);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div><h3 className="text-base font-medium text-primary">New template</h3><p className="text-sm text-tertiary">{domainLabel} workflow</p></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Template name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. LIP Pilot, High Value Client" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Applies to</label>
            <p className="text-xs text-tertiary">Select which practices this template runs for. Use this to pilot new flows with a single practice before rolling out to all.</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRACTICES.map(p => {
                const active = practices.includes(p);
                return (
                  <button key={p} onClick={() => togglePractice(p)} className={"inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " + (active ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-tertiary hover:bg-secondary_alt")}>
                    {active && <Check className="size-3" aria-hidden />}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Status</label>
            <div className="flex gap-2">
              {(["draft", "active", "archived"] as TemplateStatus[]).map(s => (
                <button key={s} onClick={() => setStatus(s)} className={"flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors " + (status === s ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary bg-primary text-tertiary hover:bg-secondary_alt")}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary">Cancel</button>
          <button onClick={() => { if (name.trim()) { onSave({ id: Date.now().toString(), name: name.trim(), status, practices, tasks: [] }); onClose(); }}} disabled={!name.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50">
            <Check className="size-3.5" aria-hidden />Create template
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Domain Modal ─────────────────────────────────────────────────────────
function NewDomainModal({ onSave, onClose }: { onSave: (d: DomainConfig) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const colors = ["bg-brand-solid", "bg-success-solid", "bg-warning-solid", "bg-error-solid", "bg-secondary"];
  const [color, setColor] = useState("bg-brand-solid");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <div><h3 className="text-base font-medium text-primary">New workflow domain</h3><p className="text-sm text-tertiary">Create a new task chain category</p></div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Domain name</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="e.g. Complaints, Renewals" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" placeholder="Brief description of this workflow" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-secondary">Colour</label>
            <div className="flex gap-2">{colors.map(c => (<button key={c} onClick={() => setColor(c)} className={"size-7 rounded-full " + c + (color === c ? " ring-2 ring-offset-2 ring-brand" : "")} />))}</div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-secondary px-5 py-4">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary">Cancel</button>
          <button onClick={() => { if (name.trim()) { onSave({ id: name.toLowerCase().replace(/\s+/g, "-"), label: name.trim(), description: desc, color, templates: [{ id: Date.now().toString(), name: "Standard", status: "draft", practices: ["All Practices"], tasks: [] }] }); onClose(); }}} disabled={!name.trim()} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50">
            <Check className="size-3.5" aria-hidden />Create domain
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, index, isFirst, domainColor, onToggle, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragOver }: {
  task: TaskItem; index: number; isFirst: boolean; domainColor: string;
  onToggle: (id: number) => void; onEdit: (t: TaskItem) => void; onDelete: (id: number) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, i: number) => void;
  isDragOver: boolean;
}) {
  return (
    <div draggable={!task.locked} onDragStart={e => onDragStart(e, index)} onDragOver={e => onDragOver(e, index)} onDrop={e => onDrop(e, index)}
      className={"group relative flex items-start sm:items-center gap-3 rounded-xl border px-3 sm:px-4 py-3 transition-all " + (isDragOver ? "border-brand bg-brand-primary_alt shadow-md" : "border-secondary bg-primary hover:border-primary hover:shadow-sm") + (!task.enabled ? " opacity-50" : "")}>
      <div className={"hidden sm:block cursor-grab text-fg-quaternary mt-0.5 " + (task.locked ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100")}><DotsGrid className="size-4" aria-hidden /></div>
      <div className="flex flex-col items-center w-6 shrink-0 mt-0.5">
        {isFirst ? (<div className={"flex size-6 items-center justify-center rounded-full text-white " + domainColor}><Zap className="size-3" aria-hidden /></div>)
          : (<div className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-tertiary">{index + 1}</div>)}
      </div>
      <div className="flex flex-1 min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex flex-1 flex-col min-w-0 gap-0.5">
          <div className="flex items-center gap-2"><span className={"text-sm font-medium " + (task.enabled ? "text-primary" : "text-disabled")}>{task.name}</span>{task.locked && <Lock01 className="size-3 text-fg-quaternary shrink-0" aria-hidden />}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-tertiary">{isFirst ? "Fires on object created" : "Fires when previous is completed"}</span>
            {task.condition && <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[11px] text-secondary font-mono">if {task.condition}</span>}
            {task.completionOptions && <span className="flex items-center gap-1 text-xs text-tertiary"><ChevronDown className="size-3" aria-hidden />{task.completionOptions.length} outcomes</span>}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="shrink-0 rounded-md border border-secondary bg-secondary px-2 py-1 text-xs text-secondary">{task.assigneeRole}</span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => onToggle(task.id)} className={"flex size-8 items-center justify-center rounded-lg transition-colors " + (task.enabled ? "text-success-primary hover:bg-success-secondary" : "text-fg-quaternary hover:bg-secondary")} title={task.enabled ? "Disable" : "Enable"}><Toggle01Right className="size-4" aria-hidden /></button>
            <button onClick={() => onEdit(task)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary" title="Edit"><Edit01 className="size-4" aria-hidden /></button>
            {!task.locked && <button onClick={() => onDelete(task.id)} className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary hover:bg-error-secondary hover:text-error-primary" title="Remove"><Trash01 className="size-4" aria-hidden /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TemplateStatus }) {
  const map: Record<TemplateStatus, string> = {
    active: "bg-success-secondary text-success-primary",
    draft: "bg-secondary text-secondary",
    archived: "bg-secondary text-disabled",
  };
  return <span className={"inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize " + map[status]}>{status}</span>;
}

// ─── Task Builder ─────────────────────────────────────────────────────────────
function TaskBuilder() {
  const [domains, setDomains] = useState<DomainConfig[]>(initialDomains);
  const [activeDomainId, setActiveDomainId] = useState("application");
  const [activeTemplateId, setActiveTemplateId] = useState("app-standard");
  const [domainDropOpen, setDomainDropOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null | "new">(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewDomain, setShowNewDomain] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const domain = domains.find(d => d.id === activeDomainId)!;
  const template = domain.templates.find(t => t.id === activeTemplateId) ?? domain.templates[0];

  function setActiveDomain(id: string) {
    setActiveDomainId(id);
    const d = domains.find(x => x.id === id)!;
    setActiveTemplateId(d.templates[0]?.id ?? "");
    setDomainDropOpen(false);
  }

  function updateTemplate(tasks: TaskItem[]) {
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : { ...d, templates: d.templates.map(t => t.id !== template.id ? t : { ...t, tasks }) }));
  }

  function updateTemplateField(field: keyof WorkflowTemplate, value: unknown) {
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : { ...d, templates: d.templates.map(t => t.id !== template.id ? t : { ...t, [field]: value }) }));
  }

  function archiveTemplate(tId: string) {
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : { ...d, templates: d.templates.map(t => t.id !== tId ? t : { ...t, status: "archived" as TemplateStatus }) }));
  }

  function handleSaveTask(task: TaskItem) {
    editingTask === "new" ? updateTemplate([...template.tasks, { ...task, triggerType: "task_completed" }]) : updateTemplate(template.tasks.map(t => t.id === task.id ? task : t));
    setEditingTask(null);
  }

  function handleAddTemplate(t: WorkflowTemplate) {
    setDomains(prev => prev.map(d => d.id !== activeDomainId ? d : { ...d, templates: [...d.templates, t] }));
    setActiveTemplateId(t.id);
  }

  function handleAddDomain(d: DomainConfig) {
    setDomains(prev => [...prev, d]);
    setActiveDomainId(d.id);
    setActiveTemplateId(d.templates[0]?.id ?? "");
  }

  function handleDragStart(_: React.DragEvent<HTMLDivElement>, i: number) { setDragIndex(i); }
  function handleDragOver(e: React.DragEvent<HTMLDivElement>, i: number) { e.preventDefault(); setDragOverIndex(i); }
  function handleDrop(_: React.DragEvent<HTMLDivElement>, dropIdx: number) {
    if (dragIndex === null || dragIndex === dropIdx) { setDragOverIndex(null); setDragIndex(null); return; }
    const tasks = [...template.tasks];
    const [moved] = tasks.splice(dragIndex, 1);
    tasks.splice(dropIdx, 0, moved);
    updateTemplate(tasks.map((t, i) => ({ ...t, triggerType: (i === 0 ? "object_created" : "task_completed") as TriggerType })));
    setDragOverIndex(null); setDragIndex(null);
  }

  const activeCount = template.tasks.filter(t => t.enabled).length;
  const nonArchivedTemplates = domain.templates.filter(t => t.status !== "archived");
  const archivedTemplates = domain.templates.filter(t => t.status === "archived");

  return (
    <div className="flex flex-col min-h-0">
      {/* Top bar — domain + template selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-secondary">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain dropdown */}
          <div className="relative">
            <button onClick={() => setDomainDropOpen(!domainDropOpen)} className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-primary hover:bg-secondary">
              <span className={"size-2 rounded-full shrink-0 " + domain.color} />{domain.label}
              <ChevronDown className={"size-4 text-fg-quaternary " + (domainDropOpen ? "rotate-180" : "")} aria-hidden />
            </button>
            {domainDropOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-20 w-52 rounded-xl border border-secondary bg-primary shadow-lg py-1">
                {domains.map(d => (
                  <button key={d.id} onClick={() => setActiveDomain(d.id)} className={"flex w-full items-center justify-between px-3 py-2.5 text-sm " + (activeDomainId === d.id ? "bg-active font-medium text-primary" : "text-secondary hover:bg-secondary_alt")}>
                    <div className="flex items-center gap-2.5"><span className={"size-2 rounded-full " + d.color} />{d.label}</div>
                    <span className="text-xs text-quaternary">{d.templates.filter(t => t.status === "active").length} active</span>
                  </button>
                ))}
                <div className="my-1 border-t border-secondary" />
                <button onClick={() => { setShowNewDomain(true); setDomainDropOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-tertiary hover:bg-secondary_alt">
                  <Plus className="size-3.5" aria-hidden />New domain
                </button>
              </div>
            )}
          </div>

          {/* Template tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            {nonArchivedTemplates.map(t => (
              <button key={t.id} onClick={() => setActiveTemplateId(t.id)}
                className={"inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors " + (activeTemplateId === t.id ? "bg-active font-medium text-primary border border-secondary" : "text-tertiary hover:bg-secondary_alt border border-transparent")}>
                {t.name}
                <StatusBadge status={t.status} />
              </button>
            ))}
            {archivedTemplates.length > 0 && (
              <span className="text-xs text-quaternary px-2">{archivedTemplates.length} archived</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-tertiary hidden lg:block">{domain.description}</p>
          {/* Add menu */}
          <div className="relative" ref={addMenuRef}>
            <button onClick={() => setAddMenuOpen(!addMenuOpen)} className="inline-flex items-center gap-1.5 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary">
              <Plus className="size-3.5" aria-hidden /><span className="hidden sm:inline">Add</span>
              <ChevronDown className={"size-3.5 text-fg-quaternary " + (addMenuOpen ? "rotate-180" : "")} aria-hidden />
            </button>
            {addMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-20 w-44 rounded-xl border border-secondary bg-primary shadow-lg py-1">
                <button onClick={() => { setEditingTask("new"); setAddMenuOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:bg-secondary_alt">
                  <Plus className="size-4 text-fg-quaternary" aria-hidden />Task
                </button>
                <button onClick={() => { setShowNewTemplate(true); setAddMenuOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:bg-secondary_alt">
                  <List className="size-4 text-fg-quaternary" aria-hidden />Template
                </button>
                <button onClick={() => { setShowNewDomain(true); setAddMenuOpen(false); }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-secondary hover:bg-secondary_alt">
                  <Settings01 className="size-4 text-fg-quaternary" aria-hidden />Domain
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
            className={"inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors " + (saved ? "bg-secondary border border-secondary text-secondary" : "bg-brand-solid text-white hover:bg-brand-solid_hover")}>
            {saved ? <><Check className="size-3.5" aria-hidden />Published</> : "Publish"}
          </button>
        </div>
      </div>

      {/* Template meta bar — practice + status editors */}
      <div className="flex flex-wrap items-center gap-4 px-4 sm:px-6 py-3 border-b border-secondary bg-secondary_alt">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-secondary">Applies to</span>
          <div className="flex gap-1.5 flex-wrap">
            {PRACTICES.filter(p => p !== "All Practices").concat(["All Practices"]).map(p => {
              const active = template.practices.includes(p);
              const isPractice = p !== "All Practices";
              function toggleP() {
                if (p === "All Practices") { updateTemplateField("practices", ["All Practices"]); return; }
                const without = template.practices.filter(x => x !== "All Practices");
                if (without.includes(p)) {
                  const next = without.filter(x => x !== p);
                  updateTemplateField("practices", next.length === 0 ? ["All Practices"] : next);
                } else {
                  updateTemplateField("practices", [...without, p]);
                }
              }
              return (
                <button key={p} onClick={toggleP}
                  className={"inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors border " + (active ? (isPractice ? PRACTICE_COLORS[p] + " border-current" : "bg-secondary text-secondary border-secondary") : "border-secondary text-quaternary hover:bg-secondary")}>
                  {active && <Check className="size-2.5" aria-hidden />}{p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-secondary">Status</span>
          {(["draft", "active", "archived"] as TemplateStatus[]).map(s => (
            <button key={s} onClick={() => updateTemplateField("status", s)}
              className={"rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors border " + (template.status === s ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary text-tertiary hover:bg-secondary")}>
              {s}
            </button>
          ))}
          {template.status !== "archived" && domain.templates.length > 1 && (
            <button onClick={() => archiveTemplate(template.id)} className="ml-2 text-xs text-quaternary hover:text-secondary transition-colors">Archive</button>
          )}
          <span className="text-xs text-quaternary">{activeCount} task{activeCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Info callout */}
      <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-2 rounded-xl border border-secondary bg-secondary_alt px-4 py-3">
        <InfoCircle className="size-4 text-fg-tertiary mt-0.5 shrink-0" aria-hidden />
        <p className="text-xs text-tertiary leading-relaxed">
          <strong className="text-secondary font-medium">First task</strong> fires on object creation. Each subsequent task fires when the previous is marked complete.
          This template applies to: <strong className="text-secondary font-medium">{template.practices.join(", ")}</strong>. Multiple active templates can coexist across different practices.
        </p>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-2 p-4 sm:p-6">
        {template.tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary py-12 text-center">
            <p className="text-sm font-medium text-secondary">No tasks yet</p>
            <p className="text-xs text-tertiary mt-1">Add the first task to start building this chain</p>
          </div>
        )}
        {template.tasks.map((task, index) => (
          <div key={task.id} className="relative">
            {index > 0 && <div className="absolute left-[2.35rem] sm:left-[3.1rem] -top-1 h-2 w-px bg-tertiary opacity-30" />}
            <TaskRow task={task} index={index} isFirst={index === 0} domainColor={domain.color}
              onToggle={id => updateTemplate(template.tasks.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))}
              onEdit={setEditingTask}
              onDelete={id => updateTemplate(template.tasks.filter(t => t.id !== id))}
              onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
              isDragOver={dragOverIndex === index} />
          </div>
        ))}
        <button onClick={() => setEditingTask("new")} className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-secondary px-4 py-3 text-sm text-tertiary hover:border-primary hover:text-secondary hover:bg-secondary_alt">
          <Plus className="size-4" aria-hidden />Add task to chain
        </button>
      </div>

      {editingTask !== null && <EditModal task={editingTask === "new" ? null : editingTask} onSave={handleSaveTask} onClose={() => setEditingTask(null)} />}
      {showNewTemplate && <NewTemplateModal domainLabel={domain.label} onSave={handleAddTemplate} onClose={() => setShowNewTemplate(false)} />}
      {showNewDomain && <NewDomainModal onSave={handleAddDomain} onClose={() => setShowNewDomain(false)} />}
    </div>
  );
}

// ─── Placeholder sections ─────────────────────────────────────────────────────
function PlaceholderSection({ title }: { title: string; description?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-12">
      <div className="text-center max-w-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-secondary bg-secondary_alt"><Settings01 className="size-5 text-fg-tertiary" aria-hidden /></div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="mt-1 text-sm text-tertiary">This section will be built out in Phase 3.</p>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────
export function Settings() {
  const [activeTab, setActiveTab] = useState("task-builder");
  return (
    <div className="flex flex-col h-full min-h-screen">
      <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Settings</h1>
        <div className="flex overflow-x-auto gap-0 -mb-px">
          {settingsTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={"flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                <Icon className={"size-4 " + (isActive ? "text-brand-secondary" : "text-fg-quaternary")} aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "task-builder" && <TaskBuilder />}
        {activeTab === "general" && <PlaceholderSection title="General" description="" />}
        {activeTab === "users" && <PlaceholderSection title="Users & Permissions" description="" />}
        {activeTab === "security" && <PlaceholderSection title="Security" description="" />}
        {activeTab === "notifications" && <PlaceholderSection title="Notifications" description="" />}
        {activeTab === "integrations" && <PlaceholderSection title="Integrations" description="" />}
      </div>
    </div>
  );
}
